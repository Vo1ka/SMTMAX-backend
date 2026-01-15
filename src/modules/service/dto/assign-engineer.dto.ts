import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, IsOptional } from 'class-validator';

export class AssignEngineerDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  engineerId: number;

  @ApiProperty({ example: 'Основной инженер на объекте', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
