import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsNumber, IsString, IsNotEmpty, Min } from 'class-validator';

export class AddIngredientDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  materialId: number;

  @ApiProperty({ example: 50.5 })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'kg' })
  @IsString()
  @IsNotEmpty()
  unit: string;
}
