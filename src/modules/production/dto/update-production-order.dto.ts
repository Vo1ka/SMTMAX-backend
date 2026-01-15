import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsPositive, IsNumber, IsDateString, IsOptional, IsIn, Min } from 'class-validator';

export class UpdateProductionOrderDto {
  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  recipeId?: number;

  @ApiProperty({ example: 120.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  plannedQty?: number;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'l', 'ml', 'pcs'], required: false })
  @IsString()
  @IsIn(['kg', 'g', 'l', 'ml', 'pcs'])
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: '2026-01-20T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  plannedDate?: string;

  @ApiProperty({ example: '2026-01-25T18:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ example: 'Обновленные заметки', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
