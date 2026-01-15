import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { QueryRecipesDto } from './dto/query-recipes.dto';

import { AddParameterDto } from './dto/add-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { PrismaService } from 'prisma/prisma.service';
import { AddIngredientDto } from './dto/add-ingridient.dto';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateIngredientDto } from './dto/update-ingridient.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRecipeDto) {
    // Проверка на существование рецептуры с таким кодом
    const existingRecipe = await this.prisma.recipe.findUnique({
      where: { code: dto.code },
    });

    if (existingRecipe) {
      throw new ConflictException('Recipe with this code already exists');
    }

    // Создание рецептуры с ингредиентами и параметрами
    const recipe = await this.prisma.recipe.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        version: dto.version,
        isActive: dto.isActive ?? true,
        ingredients: dto.ingredients
          ? {
              create: dto.ingredients.map((ing) => ({
                materialId: ing.materialId,
                quantity: ing.quantity,
                unit: ing.unit,
              })),
            }
          : undefined,
        parameters: dto.parameters
          ? {
              create: dto.parameters.map((param) => ({
                name: param.name,
                value: param.value,
                unit: param.unit,
                minValue: param.minValue,
                maxValue: param.maxValue,
              })),
            }
          : undefined,
      },
      include: {
        ingredients: {
          include: {
            material: true,
          },
        },
        parameters: true,
      },
    });

    return recipe;
  }

  async findAll(query: QueryRecipesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search;
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

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Безопасная сортировка
    const validSortFields = ['id', 'name', 'code', 'version', 'createdAt', 'updatedAt'];
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'name';
    
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [safeSortBy]: sortOrder,
    };

    // Получение данных
    const [recipes, total] = await Promise.all([
      this.prisma.recipe.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              ingredients: true,
              parameters: true,
            },
          },
        },
      }),
      this.prisma.recipe.count({ where }),
    ]);

    return {
      data: recipes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: number) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: {
        ingredients: {
          include: {
            material: true,
          },
        },
        parameters: true,
      },
    });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    return recipe;
  }

  async update(id: number, dto: UpdateRecipeDto) {
    // Проверка существования рецептуры
    const recipe = await this.prisma.recipe.findUnique({ where: { id } });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Обновление рецептуры
    const updatedRecipe = await this.prisma.recipe.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        version: dto.version,
        isActive: dto.isActive,
      },
      include: {
        ingredients: {
          include: {
            material: true,
          },
        },
        parameters: true,
      },
    });

    return updatedRecipe;
  }

  async delete(id: number) {
    // Проверка существования рецептуры
    const recipe = await this.prisma.recipe.findUnique({ where: { id } });

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Проверка, что рецептура не используется в производственных заказах
    const usedInOrders = await this.prisma.productionOrder.count({
      where: { recipeId: id },
    });

    if (usedInOrders > 0) {
      throw new ConflictException('Cannot delete recipe that is used in production orders');
    }

    // Удаление рецептуры (каскадно удалятся ингредиенты и параметры)
    await this.prisma.recipe.delete({ where: { id } });

    return { message: 'Recipe deleted successfully' };
  }

  // ============================================
  // ИНГРЕДИЕНТЫ
  // ============================================

  async addIngredient(recipeId: number, dto: AddIngredientDto) {
    // Проверка существования рецептуры
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Проверка существования материала
    const material = await this.prisma.material.findUnique({ where: { id: dto.materialId } });
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Проверка, что материал еще не добавлен в рецептуру
    const existingIngredient = await this.prisma.recipeIngredient.findFirst({
      where: {
        recipeId,
        materialId: dto.materialId,
      },
    });

    if (existingIngredient) {
      throw new BadRequestException('Material already added to this recipe');
    }

    // Добавление ингредиента
    const ingredient = await this.prisma.recipeIngredient.create({
      data: {
        recipeId,
        materialId: dto.materialId,
        quantity: dto.quantity,
        unit: dto.unit,
      },
      include: {
        material: true,
      },
    });

    return ingredient;
  }

  async updateIngredient(recipeId: number, ingredientId: number, dto: UpdateIngredientDto) {
    // Проверка существования ингредиента
    const ingredient = await this.prisma.recipeIngredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient || ingredient.recipeId !== recipeId) {
      throw new NotFoundException('Ingredient not found');
    }

    // Обновление ингредиента
    const updatedIngredient = await this.prisma.recipeIngredient.update({
      where: { id: ingredientId },
      data: {
        quantity: dto.quantity,
        unit: dto.unit,
      },
      include: {
        material: true,
      },
    });

    return updatedIngredient;
  }

  async deleteIngredient(recipeId: number, ingredientId: number) {
    // Проверка существования ингредиента
    const ingredient = await this.prisma.recipeIngredient.findUnique({
      where: { id: ingredientId },
    });

    if (!ingredient || ingredient.recipeId !== recipeId) {
      throw new NotFoundException('Ingredient not found');
    }

    // Удаление ингредиента
    await this.prisma.recipeIngredient.delete({ where: { id: ingredientId } });

    return { message: 'Ingredient deleted successfully' };
  }

  // ============================================
  // ПАРАМЕТРЫ
  // ============================================

  async addParameter(recipeId: number, dto: AddParameterDto) {
    // Проверка существования рецептуры
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    // Добавление параметра
    const parameter = await this.prisma.recipeParameter.create({
      data: {
        recipeId,
        name: dto.name,
        value: dto.value,
        unit: dto.unit,
        minValue: dto.minValue,
        maxValue: dto.maxValue,
      },
    });

    return parameter;
  }

  async updateParameter(recipeId: number, parameterId: number, dto: UpdateParameterDto) {
    // Проверка существования параметра
    const parameter = await this.prisma.recipeParameter.findUnique({
      where: { id: parameterId },
    });

    if (!parameter || parameter.recipeId !== recipeId) {
      throw new NotFoundException('Parameter not found');
    }

    // Обновление параметра
    const updatedParameter = await this.prisma.recipeParameter.update({
      where: { id: parameterId },
      data: {
        value: dto.value,
        unit: dto.unit,
        minValue: dto.minValue,
        maxValue: dto.maxValue,
      },
    });

    return updatedParameter;
  }

  async deleteParameter(recipeId: number, parameterId: number) {
    // Проверка существования параметра
    const parameter = await this.prisma.recipeParameter.findUnique({
      where: { id: parameterId },
    });

    if (!parameter || parameter.recipeId !== recipeId) {
      throw new NotFoundException('Parameter not found');
    }

    // Удаление параметра
    await this.prisma.recipeParameter.delete({ where: { id: parameterId } });

    return { message: 'Parameter deleted successfully' };
  }
}
