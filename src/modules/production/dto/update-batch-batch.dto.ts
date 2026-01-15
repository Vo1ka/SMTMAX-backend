import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateBatchStatusDto {
  @ApiProperty({ 
    example: 'COMPLETED', 
    enum: ['IN_PROGRESS', 'COMPLETED', 'DEFECTIVE'] 
  })
  @IsString()
  @IsIn(['IN_PROGRESS', 'COMPLETED', 'DEFECTIVE'])
  status: string;
}
