import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateParameterDto {
  @ApiProperty({ example: '26', required: false })
  @IsString()
  @IsOptional()
  value?: string;

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
