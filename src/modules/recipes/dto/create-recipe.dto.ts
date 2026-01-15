import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class IngredientDto {
  @ApiProperty({ example: 1 })
  materialId: number;

  @ApiProperty({ example: 50.5 })
  quantity: number;

  @ApiProperty({ example: 'kg' })
  unit: string;
}

class ParameterDto {
  @ApiProperty({ example: 'temperature' })
  name: string;

  @ApiProperty({ example: '25' })
  value: string;

  @ApiProperty({ example: '°C', required: false })
  unit?: string;

  @ApiProperty({ example: 20, required: false })
  minValue?: number;

  @ApiProperty({ example: 30, required: false })
  maxValue?: number;
}

export class CreateRecipeDto {
  @ApiProperty({ example: 'Паяльная паста SAC305' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'RCP-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Безсвинцовая паяльная паста', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '1.0' })
  @IsString()
  @IsNotEmpty()
  version: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ type: [IngredientDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IngredientDto)
  @IsOptional()
  ingredients?: IngredientDto[];

  @ApiProperty({ type: [ParameterDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ParameterDto)
  @IsOptional()
  parameters?: ParameterDto[];
}
