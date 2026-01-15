import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsNumber, IsString, IsDateString, IsOptional, Min } from 'class-validator';

export class CreateStockItemDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  materialId: number;

  @ApiProperty({ example: 'LOT-2026-001', required: false })
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiProperty({ example: 100.5 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  unit: string;

  @ApiProperty({ example: '2027-12-31T23:59:59Z', required: false })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({ example: 1, required: false })
  @IsInt()
  @IsPositive()
  @IsOptional()
  supplierId?: number;

  @ApiProperty({ example: '2026-01-15T10:00:00Z' })
  @IsDateString()
  receivedDate: string;
}
