import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsNumber, IsString, IsIn, IsOptional, Min } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  materialId: number;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  stockItemId?: number;

  @ApiProperty({ 
    example: 'ADJUSTMENT', 
    enum: ['RECEIPT', 'CONSUMPTION', 'ADJUSTMENT', 'TRANSFER'] 
  })
  @IsString()
  @IsIn(['RECEIPT', 'CONSUMPTION', 'ADJUSTMENT', 'TRANSFER'])
  movementType: string;

  @ApiProperty({ example: 10.5 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 'DOC-2026-001', required: false })
  @IsString()
  @IsOptional()
  documentNumber?: string;

  @ApiProperty({ example: 'Корректировка после инвентаризации', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
