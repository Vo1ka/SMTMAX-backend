import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class AddBatchParameterDto {
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

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isInRange?: boolean;
}
