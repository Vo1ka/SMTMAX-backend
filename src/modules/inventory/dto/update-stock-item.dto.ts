import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsOptional, Min } from 'class-validator';

export class UpdateStockItemDto {
  @ApiProperty({ example: 'LOT-2026-002', required: false })
  @IsString()
  @IsOptional()
  lotNumber?: string;

  @ApiProperty({ example: 95.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: '2027-12-31T23:59:59Z', required: false })
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiProperty({ example: '2026-01-15T10:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  receivedDate?: string;
}
