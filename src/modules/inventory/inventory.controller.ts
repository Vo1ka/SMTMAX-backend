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
import { InventoryService } from './inventory.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { CreateInventoryCheckDto } from './dto/create-inventory-check.dto';
import { AddInventoryItemDto } from './dto/add-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { QueryInventoryChecksDto } from './dto/query-inventory-checks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QueryStockItemsDto } from './dto/query-stock-item.dto';
import { QueryStockMovementsDto } from './dto/query-stock-movement.dto';
import { Roles } from 'common/decorators/roles.decorators';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private inventoryService: InventoryService) {}

  // ============================================
  // СКЛАДСКИЕ ПОЗИЦИИ
  // ============================================

  @Post('stock-items')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Add material to stock (receipt)' })
  @ApiResponse({ status: 201, description: 'Stock item created' })
  async createStockItem(@Body() dto: CreateStockItemDto) {
    return this.inventoryService.createStockItem(dto);
  }

  @Get('stock-items')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get all stock items' })
  @ApiResponse({ status: 200, description: 'List of stock items' })
  async findAllStockItems(@Query() query: QueryStockItemsDto) {
    return this.inventoryService.findAllStockItems(query);
  }

  @Get('stock-items/:id')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get stock item by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Stock item data' })
  @ApiResponse({ status: 404, description: 'Stock item not found' })
  async findStockItemById(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findStockItemById(id);
  }

  @Patch('stock-items/:id')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update stock item' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Stock item updated' })
  @ApiResponse({ status: 404, description: 'Stock item not found' })
  async updateStockItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStockItemDto,
  ) {
    return this.inventoryService.updateStockItem(id, dto);
  }

  @Delete('stock-items/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete stock item (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Stock item deleted' })
  @ApiResponse({ status: 404, description: 'Stock item not found' })
  async deleteStockItem(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteStockItem(id);
  }

  // ============================================
  // ДВИЖЕНИЕ МАТЕРИАЛОВ
  // ============================================

  @Post('stock-movements')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create manual stock movement (adjustment)' })
  @ApiResponse({ status: 201, description: 'Movement created' })
  async createStockMovement(@Body() dto: CreateStockMovementDto) {
    return this.inventoryService.createStockMovement(dto);
  }

  @Get('stock-movements')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get stock movements history' })
  @ApiResponse({ status: 200, description: 'List of movements' })
  async findAllStockMovements(@Query() query: QueryStockMovementsDto) {
    return this.inventoryService.findAllStockMovements(query);
  }

  @Get('stock/summary')
  @ApiOperation({ summary: 'Get stock summary for all materials' })
  @ApiResponse({ status: 200, description: 'Stock summary' })
  async getStockSummary() {
    return this.inventoryService.getStockSummary();
  }

  @Get('stock/low-stock')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get materials with low stock' })
  @ApiResponse({ status: 200, description: 'Low stock materials' })
  async getLowStock() {
    return this.inventoryService.getLowStock();
  }

  // ============================================
  // ИНВЕНТАРИЗАЦИЯ
  // ============================================

  @Post('inventory-checks')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create inventory check' })
  @ApiResponse({ status: 201, description: 'Inventory check created' })
  async createInventoryCheck(@Body() dto: CreateInventoryCheckDto) {
    return this.inventoryService.createInventoryCheck(dto);
  }

  @Get('inventory-checks')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get all inventory checks' })
  @ApiResponse({ status: 200, description: 'List of inventory checks' })
  async findAllInventoryChecks(@Query() query: QueryInventoryChecksDto) {
    return this.inventoryService.findAllInventoryChecks(query);
  }

  @Get('inventory-checks/:id')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get inventory check by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Inventory check data' })
  @ApiResponse({ status: 404, description: 'Inventory check not found' })
  async findInventoryCheckById(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.findInventoryCheckById(id);
  }

  @Post('inventory-checks/:id/items')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Add item to inventory check' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Item added' })
  async addInventoryItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddInventoryItemDto,
  ) {
    return this.inventoryService.addInventoryItem(id, dto);
  }

  @Patch('inventory-checks/:id/items/:itemId')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update inventory check item' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'itemId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Item updated' })
  async updateInventoryItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateInventoryItem(id, itemId, dto);
  }

  @Post('inventory-checks/:id/complete')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Complete inventory check (creates adjustments)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Inventory check completed' })
  async completeInventoryCheck(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.completeInventoryCheck(id);
  }

  @Delete('inventory-checks/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete inventory check (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Inventory check deleted' })
  async deleteInventoryCheck(@Param('id', ParseIntPipe) id: number) {
    return this.inventoryService.deleteInventoryCheck(id);
  }
}
