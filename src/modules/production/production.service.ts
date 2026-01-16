import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { QueryProductionOrdersDto } from './dto/query-production-orders.dto';
import { CreateProductionBatchDto } from './dto/create-production-batch.dto';
import { UpdateProductionBatchDto } from './dto/update-production-batch.dto';
import { AddBatchParameterDto } from './dto/add-batch-parameter.dto';
import { QueryProductionBatchesDto } from './dto/query-production-batches.dto';import { PrismaService} from '../../prisma/prisma.service';

import { UpdateBatchStatusDto } from './dto/update-batch-batch.dto';
import { UpdateOrderStatusDto } from './dto/update-status-order.dto';

@Injectable()
export class ProductionService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // ПРОИЗВОДСТВЕННЫЕ ЗАКАЗЫ
  // ============================================

  async createOrder(dto: CreateProductionOrderDto) {
    // Проверка на существование заказа с таким номером
    const existingOrder = await this.prisma.productionOrder.findUnique({
      where: { orderNumber: dto.orderNumber },
    });

    if (existingOrder) {
      throw new ConflictException('Production order with this number already exists');
    }

    // Проверка существования рецептуры
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (!recipe.isActive) {
      throw new BadRequestException('Recipe is not active');
    }

    // Создание заказа
    const order = await this.prisma.productionOrder.create({
      data: {
        orderNumber: dto.orderNumber,
        recipeId: dto.recipeId,
        plannedQty: dto.plannedQty,
        unit: dto.unit,
        plannedDate: new Date(dto.plannedDate),
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        status: 'PLANNED',
        notes: dto.notes,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return order;
  }

  async findAllOrders(query: QueryProductionOrdersDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search;
    const status = query.status;
    const recipeId = query.recipeId;
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (recipeId) {
      where.recipeId = recipeId;
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'orderNumber', 'plannedDate', 'deadline', 'status', 'createdAt', 'updatedAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [orders, total] = await Promise.all([
      this.prisma.productionOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              batches: true,
            },
          },
        },
      }),
      this.prisma.productionOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOrderById(id: number) {
    const order = await this.prisma.productionOrder.findUnique({
      where: { id },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                material: true,
              },
            },
            parameters: true,
          },
        },
        batches: {
          include: {
            producer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    return order;
  }

  async updateOrder(id: number, dto: UpdateProductionOrderDto) {
    // Проверка существования заказа
    const order = await this.prisma.productionOrder.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    // Проверка рецептуры, если меняется
    if (dto.recipeId) {
      const recipe = await this.prisma.recipe.findUnique({
        where: { id: dto.recipeId },
      });

      if (!recipe) {
        throw new NotFoundException('Recipe not found');
      }

      if (!recipe.isActive) {
        throw new BadRequestException('Recipe is not active');
      }
    }

    // Обновление заказа
    const updatedOrder = await this.prisma.productionOrder.update({
      where: { id },
      data: {
        recipeId: dto.recipeId,
        plannedQty: dto.plannedQty,
        unit: dto.unit,
        plannedDate: dto.plannedDate ? new Date(dto.plannedDate) : undefined,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        notes: dto.notes,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  async updateOrderStatus(id: number, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.productionOrder.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    const updatedOrder = await this.prisma.productionOrder.update({
      where: { id },
      data: { status: dto.status },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  async deleteOrder(id: number) {
    // Проверка существования заказа
    const order = await this.prisma.productionOrder.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundException('Production order not found');
    }

    // Проверка, что нет связанных партий
    const batchesCount = await this.prisma.productionBatch.count({
      where: { orderId: id },
    });

    if (batchesCount > 0) {
      throw new ConflictException('Cannot delete order with existing production batches');
    }

    // Удаление заказа
    await this.prisma.productionOrder.delete({ where: { id } });

    return { message: 'Production order deleted successfully' };
  }

  // ============================================
  // ПРОИЗВОДСТВЕННЫЕ ПАРТИИ
  // ============================================

  async createBatch(dto: CreateProductionBatchDto, userId: number) {
    // Проверка на существование партии с таким номером
    const existingBatch = await this.prisma.productionBatch.findUnique({
      where: { batchNumber: dto.batchNumber },
    });

    if (existingBatch) {
      throw new ConflictException('Production batch with this number already exists');
    }

    // Проверка существования рецептуры
    const recipe = await this.prisma.recipe.findUnique({
      where: { id: dto.recipeId },
      include: {
        ingredients: {
          include: {
            material: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (!recipe.isActive) {
      throw new BadRequestException('Recipe is not active');
    }

    // Проверка существования заказа (если указан)
    if (dto.orderId) {
      const order = await this.prisma.productionOrder.findUnique({
        where: { id: dto.orderId },
      });

      if (!order) {
        throw new NotFoundException('Production order not found');
      }
    }

    // Проверка наличия материалов на складе
    for (const ingredient of recipe.ingredients) {
      const requiredQty = Number(ingredient.quantity) * dto.producedQty;
      
      const stockItems = await this.prisma.stockItem.findMany({
        where: { materialId: ingredient.materialId },
      });

      const totalAvailable = stockItems.reduce((sum, item) => sum + Number(item.quantity), 0);

      if (totalAvailable < requiredQty) {
        throw new BadRequestException(
          `Insufficient stock for material "${ingredient.material.name}". Required: ${requiredQty} ${ingredient.unit}, Available: ${totalAvailable} ${ingredient.material.unit}`
        );
      }
    }

    // Создание партии с транзакцией
    const batch = await this.prisma.$transaction(async (tx) => {
      // 1. Создание партии
      const newBatch = await tx.productionBatch.create({
        data: {
          batchNumber: dto.batchNumber,
          orderId: dto.orderId,
          recipeId: dto.recipeId,
          producedQty: dto.producedQty,
          unit: dto.unit,
          productionDate: new Date(dto.productionDate),
          producedBy: userId,
          status: 'IN_PROGRESS',
          notes: dto.notes,
        },
      });

      // 2. Списание материалов
      for (const ingredient of recipe.ingredients) {
        const requiredQty = Number(ingredient.quantity) * dto.producedQty;
        let remainingQty = requiredQty;

        // Получаем складские позиции (FIFO - первые пришли, первые ушли)
        const stockItems = await tx.stockItem.findMany({
          where: { 
            materialId: ingredient.materialId,
            quantity: { gt: 0 },
          },
          orderBy: { receivedDate: 'asc' },
        });

        for (const stockItem of stockItems) {
          if (remainingQty <= 0) break;

          const qtyToConsume = Math.min(Number(stockItem.quantity), remainingQty);

          // Обновление остатка в складской позиции
          await tx.stockItem.update({
            where: { id: stockItem.id },
            data: {
              quantity: Number(stockItem.quantity) - qtyToConsume,
            },
          });

          // Создание записи о списании
          await tx.stockMovement.create({
            data: {
              materialId: ingredient.materialId,
              stockItemId: stockItem.id,
              movementType: 'CONSUMPTION',
              quantity: qtyToConsume,
              unit: ingredient.unit,
              batchId: newBatch.id,
              notes: `Списание для партии ${dto.batchNumber}`,
            },
          });

          remainingQty -= qtyToConsume;
        }

        // Создание записи использования материала
        await tx.materialUsage.create({
          data: {
            batchId: newBatch.id,
            materialId: ingredient.materialId,
            quantity: requiredQty,
            unit: ingredient.unit,
          },
        });
      }

      // 3. Добавление параметров партии
      if (dto.parameters && dto.parameters.length > 0) {
        await tx.batchParameter.createMany({
          data: dto.parameters.map((param) => ({
            batchId: newBatch.id,
            name: param.name,
            value: param.value,
            unit: param.unit,
            isInRange: param.isInRange ?? true,
          })),
        });
      }

      return newBatch;
    });

    // Возвращаем полную информацию о партии
    return this.findBatchById(batch.id);
  }

  async findAllBatches(query: QueryProductionBatchesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search;
    const status = query.status;
    const recipeId = query.recipeId;
    const orderId = query.orderId;
    const sortBy = query.sortBy ?? 'productionDate';
    const sortOrder = query.sortOrder ?? 'desc';

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: any = {};

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (recipeId) {
      where.recipeId = recipeId;
    }

    if (orderId) {
      where.orderId = orderId;
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'batchNumber', 'productionDate', 'status', 'createdAt', 'updatedAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'productionDate';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [batches, total] = await Promise.all([
      this.prisma.productionBatch.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          recipe: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          producer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.productionBatch.count({ where }),
    ]);

    return {
      data: batches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBatchById(id: number) {
    const batch = await this.prisma.productionBatch.findUnique({
      where: { id },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                material: true,
              },
            },
            parameters: true,
          },
        },
        order: {
          select: {
            id: true,
            orderNumber: true,
            plannedQty: true,
          },
        },
        producer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        parameters: true,
        materialUsage: {
          include: {
            material: true,
          },
        },
        stockMovements: {
          include: {
            material: true,
            stockItem: true,
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Production batch not found');
    }

    return batch;
  }

  async updateBatch(id: number, dto: UpdateProductionBatchDto) {
    // Проверка существования партии
    const batch = await this.prisma.productionBatch.findUnique({ where: { id } });

    if (!batch) {
      throw new NotFoundException('Production batch not found');
    }

    // Обновление партии
    const updatedBatch = await this.prisma.productionBatch.update({
      where: { id },
      data: {
        producedQty: dto.producedQty,
        unit: dto.unit,
        productionDate: dto.productionDate ? new Date(dto.productionDate) : undefined,
        notes: dto.notes,
      },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        producer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedBatch;
  }

  async updateBatchStatus(id: number, dto: UpdateBatchStatusDto) {
    const batch = await this.prisma.productionBatch.findUnique({ where: { id } });

    if (!batch) {
      throw new NotFoundException('Production batch not found');
    }

    const updatedBatch = await this.prisma.productionBatch.update({
      where: { id },
      data: { status: dto.status },
      include: {
        recipe: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return updatedBatch;
  }

  async deleteBatch(id: number) {
    // Проверка существования партии
    const batch = await this.prisma.productionBatch.findUnique({ where: { id } });

    if (!batch) {
      throw new NotFoundException('Production batch not found');
    }

    // Удаление партии (каскадно удалятся параметры, использование материалов)
    await this.prisma.productionBatch.delete({ where: { id } });

    return { message: 'Production batch deleted successfully' };
  }

  async addBatchParameter(batchId: number, dto: AddBatchParameterDto) {
    // Проверка существования партии
    const batch = await this.prisma.productionBatch.findUnique({ where: { id: batchId } });

    if (!batch) {
      throw new NotFoundException('Production batch not found');
    }

    // Добавление параметра
    const parameter = await this.prisma.batchParameter.create({
      data: {
        batchId,
        name: dto.name,
        value: dto.value,
        unit: dto.unit,
        isInRange: dto.isInRange ?? true,
      },
    });

    return parameter;
  }
}
