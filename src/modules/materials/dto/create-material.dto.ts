import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsIn, IsBoolean, Min } from 'class-validator';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Флюс RMA-223' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'MAT-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'RAW_MATERIAL', enum: ['RAW_MATERIAL', 'COMPONENT', 'SPARE_PART'] })
  @IsString()
  @IsIn(['RAW_MATERIAL', 'COMPONENT', 'SPARE_PART'])
  category: string;

  @ApiProperty({ example: 'kg', enum: ['kg', 'g', 'l', 'ml', 'pcs'] })
  @IsString()
  @IsIn(['kg', 'g', 'l', 'ml', 'pcs'])
  unit: string;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiProperty({ example: 'Флюс для паяльной пасты', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
