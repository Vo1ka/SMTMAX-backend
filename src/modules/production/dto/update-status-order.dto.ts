import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    example: 'IN_PROGRESS', 
    enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] 
  })
  @IsString()
  @IsIn(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status: string;
}
