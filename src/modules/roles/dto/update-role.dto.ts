import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['users.read', 'users.write'], type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
