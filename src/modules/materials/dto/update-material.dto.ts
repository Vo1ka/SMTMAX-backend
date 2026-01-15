import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsIn, IsBoolean, Min } from 'class-validator';

export class UpdateMaterialDto {
  @ApiProperty({ example: 'Флюс RMA-223', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'MAT-001', required: false })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ example: 'RAW_MATERIAL', enum: ['RAW_MATERIAL', 'COMPONENT', 'SPARE_PART'], required: false })
  @IsString()
  @IsIn(['RAW_MATERIAL', 'COMPONENT', 'SPARE_PART'])
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'l', 'ml', 'pcs'], required: false })
  @IsString()
  @IsIn(['kg', 'g', 'l', 'ml', 'pcs'])
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiProperty({ example: 'Флюс для паяльной пасты', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
