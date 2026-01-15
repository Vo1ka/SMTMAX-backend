import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional } from 'class-validator';

export class CreateInventoryCheckDto {
  @ApiProperty({ example: 'INV-2026-001' })
  @IsString()
  @IsNotEmpty()
  checkNumber: string;

  @ApiProperty({ example: '2026-01-15T10:00:00Z' })
  @IsDateString()
  checkDate: string;

  @ApiProperty({ example: 'Плановая инвентаризация', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
