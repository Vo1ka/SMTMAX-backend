import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class UpdateIngredientDto {
  @ApiProperty({ example: 55.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;

  @ApiProperty({ example: 'kg', required: false })
  @IsString()
  @IsOptional()
  unit?: string;
}
