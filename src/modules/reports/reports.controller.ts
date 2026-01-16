import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ProductionReportQueryDto } from './dto/production-report-query.dto';
import { StockReportQueryDto } from './dto/stock-report-query.dto';
import { ServiceReportQueryDto } from './dto/service-report-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorators';


@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // ============================================
  // ОТЧЕТЫ ПО ПРОИЗВОДСТВУ
  // ============================================

  @Get('production/summary')
  @Roles('PRODUCTION_MANAGER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get production summary report (plan/fact)' })
  @ApiResponse({ status: 200, description: 'Production summary' })
  async getProductionSummary(@Query() query: ProductionReportQueryDto) {
    return this.reportsService.getProductionSummary(query);
  }

  @Get('production/efficiency')
  @Roles('PRODUCTION_MANAGER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get production efficiency report (material usage)' })
  @ApiResponse({ status: 200, description: 'Production efficiency' })
  async getProductionEfficiency(@Query() query: ProductionReportQueryDto) {
    return this.reportsService.getProductionEfficiency(query);
  }

  @Get('production/batches')
  @Roles('PRODUCTION_MANAGER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get production batches report' })
  @ApiResponse({ status: 200, description: 'Production batches' })
  async getProductionBatches(@Query() query: ProductionReportQueryDto) {
    return this.reportsService.getProductionBatches(query);
  }

  // ============================================
  // ОТЧЕТЫ ПО СКЛАДУ
  // ============================================

  @Get('stock/movements')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get stock movements report' })
  @ApiResponse({ status: 200, description: 'Stock movements' })
  async getStockMovements(@Query() query: StockReportQueryDto) {
    return this.reportsService.getStockMovements(query);
  }

  @Get('stock/balance')
  @Roles('WAREHOUSE_MANAGER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get stock balance report (current state)' })
  @ApiResponse({ status: 200, description: 'Stock balance' })
  async getStockBalance() {
    return this.reportsService.getStockBalance();
  }

  // ============================================
  // ОТЧЕТЫ ПО СЕРВИСНЫМ РАБОТАМ
  // ============================================

  @Get('service/orders')
  @Roles('SERVICE_MANAGER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get service orders report' })
  @ApiResponse({ status: 200, description: 'Service orders' })
  async getServiceOrders(@Query() query: ServiceReportQueryDto) {
    return this.reportsService.getServiceOrders(query);
  }

  @Get('service/workload')
  @Roles('SERVICE_MANAGER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get engineers workload report' })
  @ApiResponse({ status: 200, description: 'Engineers workload' })
  async getServiceWorkload(@Query() query: ServiceReportQueryDto) {
    return this.reportsService.getServiceWorkload(query);
  }

  @Get('service/materials')
  @Roles('SERVICE_MANAGER', 'ADMIN', 'ACCOUNTANT')
  @ApiOperation({ summary: 'Get materials used in service orders report' })
  @ApiResponse({ status: 200, description: 'Service materials usage' })
  async getServiceMaterials(@Query() query: ServiceReportQueryDto) {
    return this.reportsService.getServiceMaterials(query);
  }

  // ============================================
  // ДАШБОРД
  // ============================================

  @Get('dashboard')
  @Roles('PRODUCTION_MANAGER', 'SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Get dashboard with KPIs for management' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard() {
    return this.reportsService.getDashboard();
  }
}
