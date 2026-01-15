import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateServiceOrderStatusDto {
  @ApiProperty({ 
    example: 'IN_PROGRESS', 
    enum: ['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'] 
  })
  @IsString()
  @IsIn(['PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'])
  status: string;
}
