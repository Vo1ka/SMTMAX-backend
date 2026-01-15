import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductionReportQueryDto {
  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  @IsDateString()
  dateFrom: string;

  @ApiProperty({ example: '2026-01-31T23:59:59Z' })
  @IsDateString()
  dateTo: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  recipeId?: number;
}
