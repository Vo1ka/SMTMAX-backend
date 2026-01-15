import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @IsPositive()
  roleId: number;
}
