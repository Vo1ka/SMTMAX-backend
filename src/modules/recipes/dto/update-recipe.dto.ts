import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRecipeDto {
  @ApiProperty({ example: 'Паяльная паста SAC305', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Безсвинцовая паяльная паста', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '1.1', required: false })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
