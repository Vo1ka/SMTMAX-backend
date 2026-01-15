import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsDateString, IsOptional, IsIn } from 'class-validator';

export class UpdateServiceOrderDto {
  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  customerId?: number;

  @ApiProperty({ example: 'Линия SMT', required: false })
  @IsString()
  @IsOptional()
  equipmentType?: string;

  @ApiProperty({ example: 'Yamaha YSM20', required: false })
  @IsString()
  @IsOptional()
  equipmentModel?: string;

  @ApiProperty({ example: 'г. Москва, завод "Электроника"', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Пусконаладка линии SMT', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2026-01-20T09:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  plannedStart?: string;

  @ApiProperty({ example: '2026-01-25T18:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  plannedEnd?: string;

  @ApiProperty({ example: '2026-01-20T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  actualStart?: string;

  @ApiProperty({ example: '2026-01-24T17:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  actualEnd?: string;

  @ApiProperty({ 
    example: 'HIGH', 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    required: false 
  })
  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: 'Обновленные заметки', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
