import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class AddInventoryItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  materialId: number;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(0)
  systemQty: number;

  @ApiProperty({ example: 95.5 })
  @IsNumber()
  @Min(0)
  actualQty: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: 'Обнаружена недостача', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
