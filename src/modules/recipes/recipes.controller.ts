import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { UpdateRecipeDto } from './dto/update-recipe.dto';
import { QueryRecipesDto } from './dto/query-recipes.dto';
import { AddParameterDto } from './dto/add-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AddIngredientDto } from './dto/add-ingridient.dto';
import { UpdateIngredientDto } from './dto/update-ingridient.dto';
import { Roles } from 'common/decorators/roles.decorators';

@ApiTags('Recipes')
@Controller('recipes')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RecipesController {
  constructor(private recipesService: RecipesService) {}

  @Post()
  @Roles('TECHNOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Create new recipe' })
  @ApiResponse({ status: 201, description: 'Recipe created' })
  @ApiResponse({ status: 409, description: 'Recipe already exists' })
  async create(@Body() dto: CreateRecipeDto) {
    return this.recipesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all recipes with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of recipes' })
  async findAll(@Query() query: QueryRecipesDto) {
    return this.recipesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get recipe by ID with ingredients and parameters' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Recipe data' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.findById(id);
  }

  @Patch(':id')
  @Roles('TECHNOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Update recipe' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Recipe updated' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRecipeDto,
  ) {
    return this.recipesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete recipe (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Recipe deleted' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  @ApiResponse({ status: 409, description: 'Recipe is used in production orders' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.recipesService.delete(id);
  }

  // ============================================
  // ИНГРЕДИЕНТЫ
  // ============================================

  @Post(':id/ingredients')
  @Roles('TECHNOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Add ingredient to recipe' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Ingredient added' })
  @ApiResponse({ status: 404, description: 'Recipe or Material not found' })
  async addIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddIngredientDto,
  ) {
    return this.recipesService.addIngredient(id, dto);
  }

  @Patch(':id/ingredients/:ingredientId')
  @Roles('TECHNOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Update ingredient' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'ingredientId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Ingredient updated' })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  async updateIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
    @Body() dto: UpdateIngredientDto,
  ) {
    return this.recipesService.updateIngredient(id, ingredientId, dto);
  }

  @Delete(':id/ingredients/:ingredientId')
  @Roles('TECHNOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Delete ingredient from recipe' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'ingredientId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Ingredient deleted' })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  async deleteIngredient(
    @Param('id', ParseIntPipe) id: number,
    @Param('ingredientId', ParseIntPipe) ingredientId: number,
  ) {
    return this.recipesService.deleteIngredient(id, ingredientId);
  }

  // ============================================
  // ПАРАМЕТРЫ
  // ============================================

  @Post(':id/parameters')
  @Roles('TECHNOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Add parameter to recipe' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Parameter added' })
  @ApiResponse({ status: 404, description: 'Recipe not found' })
  async addParameter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddParameterDto,
  ) {
    return this.recipesService.addParameter(id, dto);
  }

  @Patch(':id/parameters/:parameterId')
  @Roles('TECHNOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Update parameter' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'parameterId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Parameter updated' })
  @ApiResponse({ status: 404, description: 'Parameter not found' })
  async updateParameter(
    @Param('id', ParseIntPipe) id: number,
    @Param('parameterId', ParseIntPipe) parameterId: number,
    @Body() dto: UpdateParameterDto,
  ) {
    return this.recipesService.updateParameter(id, parameterId, dto);
  }

  @Delete(':id/parameters/:parameterId')
  @Roles('TECHNOLOGIST', 'ADMIN')
  @ApiOperation({ summary: 'Delete parameter from recipe' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'parameterId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Parameter deleted' })
  @ApiResponse({ status: 404, description: 'Parameter not found' })
  async deleteParameter(
    @Param('id', ParseIntPipe) id: number,
    @Param('parameterId', ParseIntPipe) parameterId: number,
  ) {
    return this.recipesService.deleteParameter(id, parameterId);
  }
}
