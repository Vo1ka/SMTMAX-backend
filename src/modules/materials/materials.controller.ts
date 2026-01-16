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
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorators';
import { QueryMaterialsDto } from './dto/query-material.dto';

@ApiTags('Materials')
@Controller('materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Post()
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create new material' })
  @ApiResponse({ status: 201, description: 'Material created' })
  @ApiResponse({ status: 409, description: 'Material already exists' })
  async create(@Body() dto: CreateMaterialDto) {
    return this.materialsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all materials with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of materials' })
  async findAll(@Query() query: QueryMaterialsDto) {
    return this.materialsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get material by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Material data' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.findById(id);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get stock information for material' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Stock information' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async getStock(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.getStock(id);
  }

  @Patch(':id')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update material' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Material updated' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMaterialDto,
  ) {
    return this.materialsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete material (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Material deleted' })
  @ApiResponse({ status: 404, description: 'Material not found' })
  @ApiResponse({ status: 409, description: 'Material is used in recipes' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.materialsService.delete(id);
  }
}
