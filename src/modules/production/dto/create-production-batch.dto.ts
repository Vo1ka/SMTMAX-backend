import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsPositive, IsNumber, IsDateString, IsOptional, IsIn, Min, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BatchParameterDto {
  @ApiProperty({ example: 'temperature' })
  name: string;

  @ApiProperty({ example: '25' })
  value: string;

  @ApiProperty({ example: '°C', required: false })
  unit?: string;

  @ApiProperty({ example: true, required: false })
  isInRange?: boolean;
}

export class CreateProductionBatchDto {
  @ApiProperty({ example: 'BATCH-2026-001' })
  @IsString()
  @IsNotEmpty()
  batchNumber: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  orderId?: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  recipeId: number;

  @ApiProperty({ example: 50.5 })
  @IsNumber()
  @Min(0)
  producedQty: number;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'l', 'ml', 'pcs'] })
  @IsString()
  @IsIn(['kg', 'g', 'l', 'ml', 'pcs'])
  unit: string;

  @ApiProperty({ example: '2026-01-15T10:00:00Z' })
  @IsDateString()
  productionDate: string;

  @ApiProperty({ example: 'Стандартное производство', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [BatchParameterDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchParameterDto)
  @IsOptional()
  parameters?: BatchParameterDto[];
}
