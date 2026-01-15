import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { QueryMaterialsDto } from './dto/query-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';


@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMaterialDto) {
    // Проверка на существование материала с таким кодом
    const existingMaterial = await this.prisma.material.findUnique({
      where: { code: dto.code },
    });

    if (existingMaterial) {
      throw new ConflictException('Material with this code already exists');
    }

    // Создание материала
    const material = await this.prisma.material.create({
      data: {
        name: dto.name,
        code: dto.code,
        category: dto.category,
        unit: dto.unit,
        minStock: dto.minStock,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });

    return material;
  }

  async findAll(query: QueryMaterialsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search;
    const category = query.category;
    const isActive = query.isActive;
    const sortBy = query.sortBy ?? 'name';
    const sortOrder = query.sortOrder ?? 'asc';

    const skip = (page - 1) * limit;

    // Построение фильтров
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'name', 'code', 'category', 'createdAt', 'updatedAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [materials, total] = await Promise.all([
      this.prisma.material.findMany({
        where,
        skip,
        take: limit,
        orderBy,
      }),
      this.prisma.material.count({ where }),
    ]);

    return {
      data: materials,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const material = await this.prisma.material.findUnique({
      where: { id },
      include: {
        recipeIngredients: {
          include: {
            recipe: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async update(id: number, dto: UpdateMaterialDto) {
    // Проверка существования материала
    const material = await this.prisma.material.findUnique({ where: { id } });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Проверка кода на уникальность
    if (dto.code && dto.code !== material.code) {
      const existingMaterial = await this.prisma.material.findUnique({
        where: { code: dto.code },
      });

      if (existingMaterial) {
        throw new ConflictException('Material with this code already exists');
      }
    }

    // Обновление материала
    const updatedMaterial = await this.prisma.material.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        category: dto.category,
        unit: dto.unit,
        minStock: dto.minStock,
        description: dto.description,
        isActive: dto.isActive,
      },
    });

    return updatedMaterial;
  }

  async delete(id: number) {
    // Проверка существования материала
    const material = await this.prisma.material.findUnique({ where: { id } });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Проверка, что материал не используется в рецептурах
    const usedInRecipes = await this.prisma.recipeIngredient.count({
      where: { materialId: id },
    });

    if (usedInRecipes > 0) {
      throw new ConflictException('Cannot delete material that is used in recipes');
    }

    // Удаление материала
    await this.prisma.material.delete({ where: { id } });

    return { message: 'Material deleted successfully' };
  }

  async getStock(id: number) {
    const material = await this.prisma.material.findUnique({ where: { id } });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Подсчет остатков
    const stockItems = await this.prisma.stockItem.findMany({
      where: { materialId: id },
    });

    const totalQuantity = stockItems.reduce((sum, item) => {
      return sum + Number(item.quantity);
    }, 0);

    return {
      materialId: id,
      materialName: material.name,
      materialCode: material.code,
      unit: material.unit,
      totalQuantity,
      minStock: material.minStock,
      isLowStock: material.minStock ? totalQuantity < Number(material.minStock) : false,
      stockItems: stockItems.map(item => ({
        id: item.id,
        lotNumber: item.lotNumber,
        quantity: item.quantity,
        expiryDate: item.expiryDate,
        receivedDate: item.receivedDate,
      })),
    };
  }
}
