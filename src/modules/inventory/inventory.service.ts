import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { CreateInventoryCheckDto } from './dto/create-inventory-check.dto';
import { AddInventoryItemDto } from './dto/add-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryChecksDto } from './dto/query-inventory-checks.dto';
import { QueryStockItemsDto } from './dto/query-stock-item.dto';
import { QueryStockMovementsDto } from './dto/query-stock-movement.dto';
import { PrismaService} from '../../prisma/prisma.service';


@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // СКЛАДСКИЕ ПОЗИЦИИ (STOCK ITEMS)
  // ============================================

  async createStockItem(dto: CreateStockItemDto) {
    // Проверка существования материала
    const material = await this.prisma.material.findUnique({
      where: { id: dto.materialId },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Проверка существования поставщика (если указан)
    if (dto.supplierId) {
      const supplier = await this.prisma.contractor.findUnique({
        where: { id: dto.supplierId },
      });

      if (!supplier) {
        throw new NotFoundException('Supplier not found');
      }
    }

    // Создание складской позиции и движения в транзакции
    const stockItem = await this.prisma.$transaction(async (tx) => {
      // Создание складской позиции
      const newStockItem = await tx.stockItem.create({
        data: {
          materialId: dto.materialId,
          lotNumber: dto.lotNumber,
          quantity: dto.quantity,
          unit: dto.unit,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          supplierId: dto.supplierId,
          receivedDate: new Date(dto.receivedDate),
        },
        include: {
          material: true,
          supplier: true,
        },
      });

      // Создание записи о поступлении
      await tx.stockMovement.create({
        data: {
          materialId: dto.materialId,
          stockItemId: newStockItem.id,
          movementType: 'RECEIPT',
          quantity: dto.quantity,
          unit: dto.unit,
          documentNumber: dto.lotNumber,
          notes: `Поступление на склад${dto.supplierId ? ` от поставщика` : ''}`,
        },
      });

      return newStockItem;
    });

    return stockItem;
  }

  async findAllStockItems(query: QueryStockItemsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const materialId = query.materialId;
    const supplierId = query.supplierId;
    const sortBy = query.sortBy ?? 'receivedDate';
    const sortOrder = query.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: any = {};

    if (materialId) {
      where.materialId = materialId;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'receivedDate', 'expiryDate', 'quantity', 'createdAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'receivedDate';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [stockItems, total] = await Promise.all([
      this.prisma.stockItem.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          material: true,
          supplier: true,
        },
      }),
      this.prisma.stockItem.count({ where }),
    ]);

    return {
      data: stockItems,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findStockItemById(id: number) {
    const stockItem = await this.prisma.stockItem.findUnique({
      where: { id },
      include: {
        material: true,
        supplier: true,
        movements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!stockItem) {
      throw new NotFoundException('Stock item not found');
    }

    return stockItem;
  }

  async updateStockItem(id: number, dto: UpdateStockItemDto) {
    const stockItem = await this.prisma.stockItem.findUnique({ where: { id } });

    if (!stockItem) {
      throw new NotFoundException('Stock item not found');
    }

    const updatedStockItem = await this.prisma.stockItem.update({
      where: { id },
      data: {
        lotNumber: dto.lotNumber,
        quantity: dto.quantity,
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : undefined,
      },
      include: {
        material: true,
        supplier: true,
      },
    });

    return updatedStockItem;
  }

  async deleteStockItem(id: number) {
    const stockItem = await this.prisma.stockItem.findUnique({ where: { id } });

    if (!stockItem) {
      throw new NotFoundException('Stock item not found');
    }

    // Проверка, что позиция не используется в движениях
    const movementsCount = await this.prisma.stockMovement.count({
      where: { stockItemId: id },
    });

    if (movementsCount > 0) {
      throw new ConflictException('Cannot delete stock item with movements');
    }

    await this.prisma.stockItem.delete({ where: { id } });

    return { message: 'Stock item deleted successfully' };
  }

  // ============================================
  // ДВИЖЕНИЕ МАТЕРИАЛОВ (STOCK MOVEMENTS)
  // ============================================

  async createStockMovement(dto: CreateStockMovementDto) {
    // Проверка существования материала
    const material = await this.prisma.material.findUnique({
      where: { id: dto.materialId },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Проверка существования складской позиции (если указана)
    if (dto.stockItemId) {
      const stockItem = await this.prisma.stockItem.findUnique({
        where: { id: dto.stockItemId },
      });

      if (!stockItem) {
        throw new NotFoundException('Stock item not found');
      }

      // Для корректировки обновляем остаток
      if (dto.movementType === 'ADJUSTMENT') {
        await this.prisma.stockItem.update({
          where: { id: dto.stockItemId },
          data: {
            quantity: dto.quantity,
          },
        });
      }
    }

    // Создание движения
    const movement = await this.prisma.stockMovement.create({
      data: {
        materialId: dto.materialId,
        stockItemId: dto.stockItemId,
        movementType: dto.movementType,
        quantity: dto.quantity,
        unit: dto.unit,
        documentNumber: dto.documentNumber,
        notes: dto.notes,
      },
      include: {
        material: true,
        stockItem: true,
      },
    });

    return movement;
  }

  async findAllStockMovements(query: QueryStockMovementsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const materialId = query.materialId;
    const movementType = query.movementType;
    const dateFrom = query.dateFrom;
    const dateTo = query.dateTo;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: any = {};

    if (materialId) {
      where.materialId = materialId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo);
      }
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'createdAt', 'quantity', 'movementType'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          material: true,
          stockItem: true,
          batch: {
            select: {
              id: true,
              batchNumber: true,
            },
          },
          serviceOrder: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStockSummary() {
    // Получаем все материалы с остатками
    const materials = await this.prisma.material.findMany({
      where: { isActive: true },
      include: {
        stockItems: true,
      },
    });

    const summary = materials.map((material) => {
      const totalQuantity = material.stockItems.reduce(
        (sum, item) => sum + Number(item.quantity),
        0,
      );

      const isLowStock = material.minStock
        ? totalQuantity < Number(material.minStock)
        : false;

      return {
        materialId: material.id,
        materialName: material.name,
        materialCode: material.code,
        category: material.category,
        unit: material.unit,
        totalQuantity,
        minStock: material.minStock,
        isLowStock,
      };
    });

    return summary;
  }

  async getLowStock() {
    const materials = await this.prisma.material.findMany({
      where: {
        isActive: true,
        minStock: { not: null },
      },
      include: {
        stockItems: true,
      },
    });

    const lowStockMaterials = materials
      .map((material) => {
        const totalQuantity = material.stockItems.reduce(
          (sum, item) => sum + Number(item.quantity),
          0,
        );

        return {
          materialId: material.id,
          materialName: material.name,
          materialCode: material.code,
          unit: material.unit,
          totalQuantity,
          minStock: material.minStock,
          shortage: Number(material.minStock) - totalQuantity,
        };
      })
      .filter((item) => item.totalQuantity < Number(item.minStock));

    return lowStockMaterials;
  }

  // ============================================
  // ИНВЕНТАРИЗАЦИЯ (INVENTORY CHECKS)
  // ============================================

  async createInventoryCheck(dto: CreateInventoryCheckDto) {
    // Проверка на существование инвентаризации с таким номером
    const existingCheck = await this.prisma.inventoryCheck.findUnique({
      where: { checkNumber: dto.checkNumber },
    });

    if (existingCheck) {
      throw new ConflictException('Inventory check with this number already exists');
    }

    const check = await this.prisma.inventoryCheck.create({
      data: {
        checkNumber: dto.checkNumber,
        checkDate: new Date(dto.checkDate),
        status: 'IN_PROGRESS',
        notes: dto.notes,
      },
    });

    return check;
  }

  async findAllInventoryChecks(query: QueryInventoryChecksDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const status = query.status;
    const sortBy = query.sortBy ?? 'checkDate';
    const sortOrder = query.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: any = {};

    if (status) {
      where.status = status;
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'checkNumber', 'checkDate', 'status', 'createdAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'checkDate';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [checks, total] = await Promise.all([
      this.prisma.inventoryCheck.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      this.prisma.inventoryCheck.count({ where }),
    ]);

    return {
      data: checks,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findInventoryCheckById(id: number) {
    const check = await this.prisma.inventoryCheck.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!check) {
      throw new NotFoundException('Inventory check not found');
    }

    return check;
  }

  async addInventoryItem(checkId: number, dto: AddInventoryItemDto) {
    // Проверка существования инвентаризации
    const check = await this.prisma.inventoryCheck.findUnique({
      where: { id: checkId },
    });

    if (!check) {
      throw new NotFoundException('Inventory check not found');
    }

    if (check.status === 'COMPLETED') {
      throw new BadRequestException('Cannot add items to completed inventory check');
    }

    // Проверка существования материала
    const material = await this.prisma.material.findUnique({
      where: { id: dto.materialId },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Проверка, что материал еще не добавлен
    const existingItem = await this.prisma.inventoryCheckItem.findFirst({
      where: {
        checkId,
        materialId: dto.materialId,
      },
    });

    if (existingItem) {
      throw new BadRequestException('Material already added to this inventory check');
    }

    // Вычисление разницы
    const difference = dto.actualQty - dto.systemQty;

    // Добавление позиции
    const item = await this.prisma.inventoryCheckItem.create({
      data: {
        checkId,
        materialId: dto.materialId,
        systemQty: dto.systemQty,
        actualQty: dto.actualQty,
        difference,
        unit: dto.unit,
        notes: dto.notes,
      },
      include: {
        material: true,
      },
    });

    return item;
  }

  async updateInventoryItem(checkId: number, itemId: number, dto: UpdateInventoryItemDto) {
    // Проверка существования позиции
    const item = await this.prisma.inventoryCheckItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.checkId !== checkId) {
      throw new NotFoundException('Inventory check item not found');
    }

    // Проверка статуса инвентаризации
    const check = await this.prisma.inventoryCheck.findUnique({
      where: { id: checkId },
    });

    if (check?.status === 'COMPLETED') {
      throw new BadRequestException('Cannot update items in completed inventory check');
    }

    // Вычисление новой разницы
    const systemQty = dto.systemQty ?? item.systemQty;
    const actualQty = dto.actualQty ?? item.actualQty;
    const difference = Number(actualQty) - Number(systemQty);

    // Обновление позиции
    const updatedItem = await this.prisma.inventoryCheckItem.update({
      where: { id: itemId },
      data: {
        systemQty: dto.systemQty,
        actualQty: dto.actualQty,
        difference,
        notes: dto.notes,
      },
      include: {
        material: true,
      },
    });

    return updatedItem;
  }

  async completeInventoryCheck(checkId: number) {
    // Проверка существования инвентаризации
    const check = await this.prisma.inventoryCheck.findUnique({
      where: { id: checkId },
      include: {
        items: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!check) {
      throw new NotFoundException('Inventory check not found');
    }

    if (check.status === 'COMPLETED') {
      throw new BadRequestException('Inventory check already completed');
    }

    if (check.items.length === 0) {
      throw new BadRequestException('Cannot complete inventory check without items');
    }

    // Завершение инвентаризации с транзакцией
    const result = await this.prisma.$transaction(async (tx) => {
      // Обновление статуса
      const updatedCheck = await tx.inventoryCheck.update({
        where: { id: checkId },
        data: { status: 'COMPLETED' },
      });

      // Создание корректирующих движений для расхождений
      for (const item of check.items) {
        if (Number(item.difference) !== 0) {
          // Находим или создаем складскую позицию
          let stockItem = await tx.stockItem.findFirst({
            where: { materialId: item.materialId },
            orderBy: { receivedDate: 'desc' },
          });

          if (!stockItem) {
            // Создаем новую складскую позицию
            stockItem = await tx.stockItem.create({
              data: {
                materialId: item.materialId,
                quantity: item.actualQty,
                unit: item.unit,
                receivedDate: new Date(),
              },
            });
          } else {
            // Обновляем остаток
            await tx.stockItem.update({
              where: { id: stockItem.id },
              data: {
                quantity: item.actualQty,
              },
            });
          }

          // Создаем корректирующее движение
          await tx.stockMovement.create({
            data: {
              materialId: item.materialId,
              stockItemId: stockItem.id,
              movementType: 'ADJUSTMENT',
              quantity: Math.abs(Number(item.difference)),
              unit: item.unit,
              documentNumber: check.checkNumber,
              notes: `Корректировка по инвентаризации ${check.checkNumber}: ${
                Number(item.difference) > 0 ? 'излишек' : 'недостача'
              }`,
            },
          });
        }
      }

      return updatedCheck;
    });

    return this.findInventoryCheckById(result.id);
  }

  async deleteInventoryCheck(id: number) {
    const check = await this.prisma.inventoryCheck.findUnique({ where: { id } });

    if (!check) {
      throw new NotFoundException('Inventory check not found');
    }

    if (check.status === 'COMPLETED') {
      throw new BadRequestException('Cannot delete completed inventory check');
    }

    await this.prisma.inventoryCheck.delete({ where: { id } });

    return { message: 'Inventory check deleted successfully' };
  }
}
