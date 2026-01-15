import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';

export class UpdateWorkLogDto {
  @ApiProperty({ example: '2026-01-20T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  workDate?: string;

  @ApiProperty({ example: '2026-01-20T09:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ example: '2026-01-20T18:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ example: 'Обновленное описание работ', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Обновленный результат', required: false })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiProperty({ 
    example: 'COMPLETED', 
    enum: ['IN_PROGRESS', 'COMPLETED', 'ISSUE'],
    required: false
  })
  @IsString()
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'ISSUE'])
  @IsOptional()
  status?: string;
}
