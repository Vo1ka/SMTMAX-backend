import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsIn, Min } from 'class-validator';

export class UpdateProductionBatchDto {
  @ApiProperty({ example: 55.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  producedQty?: number;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'l', 'ml', 'pcs'], required: false })
  @IsString()
  @IsIn(['kg', 'g', 'l', 'ml', 'pcs'])
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: '2026-01-15T12:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  productionDate?: string;

  @ApiProperty({ example: 'Обновленные заметки', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
