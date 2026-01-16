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
import { ProductionService } from './production.service';
import { CreateProductionOrderDto } from './dto/create-production-order.dto';
import { UpdateProductionOrderDto } from './dto/update-production-order.dto';
import { QueryProductionOrdersDto } from './dto/query-production-orders.dto';
import { CreateProductionBatchDto } from './dto/create-production-batch.dto';
import { UpdateProductionBatchDto } from './dto/update-production-batch.dto';
import { AddBatchParameterDto } from './dto/add-batch-parameter.dto';
import { QueryProductionBatchesDto } from './dto/query-production-batches.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateBatchStatusDto } from './dto/update-batch-batch.dto';
import { UpdateOrderStatusDto } from './dto/update-status-order.dto';
import { Roles } from 'common/decorators/roles.decorators';

@ApiTags('Production')
@Controller('production')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductionController {
  constructor(private productionService: ProductionService) {}

  // ============================================
  // ПРОИЗВОДСТВЕННЫЕ ЗАКАЗЫ
  // ============================================

  @Post('orders')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create production order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 409, description: 'Order already exists' })
  async createOrder(@Body() dto: CreateProductionOrderDto) {
    return this.productionService.createOrder(dto);
  }

  @Get('orders')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get all production orders' })
  @ApiResponse({ status: 200, description: 'List of orders' })
  async findAllOrders(@Query() query: QueryProductionOrdersDto) {
    return this.productionService.findAllOrders(query);
  }

  @Get('orders/:id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get production order by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Order data' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOrderById(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.findOrderById(id);
  }

  @Patch('orders/:id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update production order' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionOrderDto,
  ) {
    return this.productionService.updateOrder(id, dto);
  }

  @Patch('orders/:id/status')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update production order status' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.productionService.updateOrderStatus(id, dto);
  }

  @Delete('orders/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete production order (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Order deleted' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 409, description: 'Order has batches' })
  async deleteOrder(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.deleteOrder(id);
  }

  // ============================================
  // ПРОИЗВОДСТВЕННЫЕ ПАРТИИ
  // ============================================

  @Post('batches')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create production batch (auto-consumes materials)' })
  @ApiResponse({ status: 201, description: 'Batch created, materials consumed' })
  @ApiResponse({ status: 400, description: 'Insufficient stock' })
  async createBatch(
    @Body() dto: CreateProductionBatchDto,
    @CurrentUser() user: any,
  ) {
    return this.productionService.createBatch(dto, user.id);
  }

  @Get('batches')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get all production batches' })
  @ApiResponse({ status: 200, description: 'List of batches' })
  async findAllBatches(@Query() query: QueryProductionBatchesDto) {
    return this.productionService.findAllBatches(query);
  }

  @Get('batches/:id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get production batch by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Batch data' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async findBatchById(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.findBatchById(id);
  }

  @Patch('batches/:id')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update production batch' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Batch updated' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async updateBatch(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductionBatchDto,
  ) {
    return this.productionService.updateBatch(id, dto);
  }

  @Patch('batches/:id/status')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update production batch status' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async updateBatchStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBatchStatusDto,
  ) {
    return this.productionService.updateBatchStatus(id, dto);
  }

  @Delete('batches/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete production batch (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Batch deleted' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async deleteBatch(@Param('id', ParseIntPipe) id: number) {
    return this.productionService.deleteBatch(id);
  }

  @Post('batches/:id/parameters')
  @Roles('PRODUCTION_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Add parameter to batch' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Parameter added' })
  @ApiResponse({ status: 404, description: 'Batch not found' })
  async addBatchParameter(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddBatchParameterDto,
  ) {
    return this.productionService.addBatchParameter(id, dto);
  }
}
