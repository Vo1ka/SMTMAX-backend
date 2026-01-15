import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class AddParameterDto {
  @ApiProperty({ example: 'temperature' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '25' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: '°C', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 20, required: false })
  @IsNumber()
  @IsOptional()
  minValue?: number;

  @ApiProperty({ example: 30, required: false })
  @IsNumber()
  @IsOptional()
  maxValue?: number;
}
