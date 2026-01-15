import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryMaterialsDto {
  @ApiProperty({ required: false, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: ['RAW_MATERIAL', 'COMPONENT', 'SPARE_PART'] })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, enum: ['true', 'false'] })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiProperty({ required: false, example: 'name' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiProperty({ required: false, enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}
