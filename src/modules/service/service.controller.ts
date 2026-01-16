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
import { ServiceService } from './service.service';
import { CreateServiceOrderDto } from './dto/create-service-order.dto';
import { UpdateServiceOrderDto } from './dto/update-service-order.dto';
import { UpdateServiceOrderStatusDto } from './dto/update-service-order-status.dto';
import { QueryServiceOrdersDto } from './dto/query-service-orders.dto';
import { AssignEngineerDto } from './dto/assign-engineer.dto';
import { CreateWorkLogDto } from './dto/create-work-log.dto';
import { UpdateWorkLogDto } from './dto/update-work-log.dto';
import { QueryWorkLogsDto } from './dto/query-work-logs.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorators';


@ApiTags('Service Orders')
@Controller('service-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServiceController {
  constructor(private serviceService: ServiceService) {}

  // ============================================
  // СЕРВИСНЫЕ ЗАКАЗЫ
  // ============================================

  @Post()
  @Roles('SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create service order' })
  @ApiResponse({ status: 201, description: 'Service order created' })
  async createOrder(@Body() dto: CreateServiceOrderDto) {
    return this.serviceService.createOrder(dto);
  }

  @Get()
  @Roles('SERVICE_MANAGER', 'ENGINEER', 'ADMIN')
  @ApiOperation({ summary: 'Get all service orders (Engineer sees only assigned)' })
  @ApiResponse({ status: 200, description: 'List of service orders' })
  async findAllOrders(
    @Query() query: QueryServiceOrdersDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceService.findAllOrders(query, user.roles, user.id);
  }

  @Get(':id')
  @Roles('SERVICE_MANAGER', 'ENGINEER', 'ADMIN')
  @ApiOperation({ summary: 'Get service order by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Service order data' })
  @ApiResponse({ status: 404, description: 'Service order not found' })
  async findOrderById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.serviceService.findOrderById(id, user.roles, user.id);
  }

  @Patch(':id')
  @Roles('SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update service order' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Service order updated' })
  async updateOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceOrderDto,
  ) {
    return this.serviceService.updateOrder(id, dto);
  }

  @Patch(':id/status')
  @Roles('SERVICE_MANAGER', 'ENGINEER', 'ADMIN')
  @ApiOperation({ summary: 'Update service order status' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceOrderStatusDto,
  ) {
    return this.serviceService.updateOrderStatus(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete service order (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Service order deleted' })
  async deleteOrder(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.deleteOrder(id);
  }

  // ============================================
  // НАЗНАЧЕНИЕ ИНЖЕНЕРОВ
  // ============================================

  @Post(':id/assignments')
  @Roles('SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Assign engineer to service order' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Engineer assigned' })
  async assignEngineer(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEngineerDto,
  ) {
    return this.serviceService.assignEngineer(id, dto);
  }

  @Delete(':id/assignments/:assignmentId')
  @Roles('SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Remove engineer from service order' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'assignmentId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Engineer removed' })
  async removeEngineer(
    @Param('id', ParseIntPipe) id: number,
    @Param('assignmentId', ParseIntPipe) assignmentId: number,
  ) {
    return this.serviceService.removeEngineer(id, assignmentId);
  }

  // ============================================
  // ЖУРНАЛ РАБОТ
  // ============================================

  @Post(':id/work-logs')
  @Roles('ENGINEER', 'SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Add work log entry' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 201, description: 'Work log created' })
  async createWorkLog(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateWorkLogDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceService.createWorkLog(id, dto, user.id);
  }

  @Get(':id/work-logs')
  @Roles('SERVICE_MANAGER', 'ENGINEER', 'ADMIN')
  @ApiOperation({ summary: 'Get work logs for service order' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'List of work logs' })
  async findWorkLogsByOrder(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryWorkLogsDto,
  ) {
    return this.serviceService.findWorkLogsByOrder(id, query);
  }

  @Patch(':id/work-logs/:workLogId')
  @Roles('ENGINEER', 'SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update work log (only own or manager/admin)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'workLogId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Work log updated' })
  async updateWorkLog(
    @Param('id', ParseIntPipe) id: number,
    @Param('workLogId', ParseIntPipe) workLogId: number,
    @Body() dto: UpdateWorkLogDto,
    @CurrentUser() user: any,
  ) {
    return this.serviceService.updateWorkLog(id, workLogId, dto, user.id, user.roles);
  }

  @Delete(':id/work-logs/:workLogId')
  @Roles('ENGINEER', 'SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Delete work log (only own or manager/admin)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiParam({ name: 'workLogId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Work log deleted' })
  async deleteWorkLog(
    @Param('id', ParseIntPipe) id: number,
    @Param('workLogId', ParseIntPipe) workLogId: number,
    @CurrentUser() user: any,
  ) {
    return this.serviceService.deleteWorkLog(id, workLogId, user.id, user.roles);
  }

  // ============================================
  // ДОКУМЕНТЫ
  // ============================================

  @Get(':id/documents')
  @Roles('SERVICE_MANAGER', 'ENGINEER', 'ADMIN')
  @ApiOperation({ summary: 'Get documents for service order' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'List of documents' })
  async getDocuments(@Param('id', ParseIntPipe) id: number) {
    return this.serviceService.getDocuments(id);
  }

  // Загрузка файлов будет реализована позже
}
