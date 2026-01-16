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
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from 'common/decorators/roles.decorators';


@ApiTags('Contractors')
@Controller('contractors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ContractorsController {
  constructor(private contractorsService: ContractorsService) {}

  @Post()
  @Roles('WAREHOUSE_MANAGER', 'SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Create contractor' })
  @ApiResponse({ status: 201, description: 'Contractor created' })
  async create(@Body() dto: CreateContractorDto) {
    return this.contractorsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contractors' })
  @ApiResponse({ status: 200, description: 'List of contractors' })
  async findAll(@Query('type') type?: string) {
    return this.contractorsService.findAll(type);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contractor by ID' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contractor data' })
  async findById(@Param('id', ParseIntPipe) id: number) {
    return this.contractorsService.findById(id);
  }

  @Patch(':id')
  @Roles('WAREHOUSE_MANAGER', 'SERVICE_MANAGER', 'ADMIN')
  @ApiOperation({ summary: 'Update contractor' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contractor updated' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractorDto,
  ) {
    return this.contractorsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete contractor (Admin only)' })
  @ApiParam({ name: 'id', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contractor deleted' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.contractorsService.delete(id);
  }
}
