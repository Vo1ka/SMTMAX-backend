import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsPositive, IsNumber, IsDateString, IsOptional, IsIn, Min } from 'class-validator';

export class CreateProductionOrderDto {
  @ApiProperty({ example: 'PO-2026-001' })
  @IsString()
  @IsNotEmpty()
  orderNumber: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  recipeId: number;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0)
  plannedQty: number;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'l', 'ml', 'pcs'] })
  @IsString()
  @IsIn(['kg', 'g', 'l', 'ml', 'pcs'])
  unit: string;

  @ApiProperty({ example: '2026-01-20T10:00:00Z' })
  @IsDateString()
  plannedDate: string;

  @ApiProperty({ example: '2026-01-25T18:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  deadline?: string;

  @ApiProperty({ example: 'Срочный заказ', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
