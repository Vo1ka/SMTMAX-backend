import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'CUSTOM_ROLE' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Custom role description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['users.read', 'users.write'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];
}
