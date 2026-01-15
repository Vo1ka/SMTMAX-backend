import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UpdateInventoryItemDto {
  @ApiProperty({ example: 100.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  systemQty?: number;

  @ApiProperty({ example: 96.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  actualQty?: number;

  @ApiProperty({ example: 'Исправлена ошибка подсчета', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
