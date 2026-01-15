import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsOptional, IsIn } from 'class-validator';

export class CreateWorkLogDto {
  @ApiProperty({ example: '2026-01-20T00:00:00Z' })
  @IsDateString()
  workDate: string;

  @ApiProperty({ example: '2026-01-20T09:00:00Z' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ example: '2026-01-20T18:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ example: 'Выполнена калибровка оборудования' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Калибровка завершена успешно', required: false })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiProperty({ 
    example: 'IN_PROGRESS', 
    enum: ['IN_PROGRESS', 'COMPLETED', 'ISSUE'],
    required: false,
    default: 'IN_PROGRESS'
  })
  @IsString()
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'ISSUE'])
  @IsOptional()
  status?: string;
}
