import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsPositive, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateServiceOrderDto {
  @ApiProperty({ example: 'SO-2026-001' })
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  customerId: number;

  @ApiProperty({ example: 'Линия SMT' })
  @IsString()
  @IsNotEmpty()
  equipmentType: string;

  @ApiProperty({ example: 'Yamaha YSM20', required: false })
  @IsString()
  @IsOptional()
  equipmentModel?: string;

  @ApiProperty({ example: 'г. Москва, завод "Электроника"' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'Пусконаладка линии SMT' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: '2026-01-20T09:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  plannedStart?: string;

  @ApiProperty({ example: '2026-01-25T18:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  plannedEnd?: string;

  @ApiProperty({ 
    example: 'HIGH', 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    required: false 
  })
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: 'Требуется калибровка', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
