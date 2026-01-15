import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsIn, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class CreateContractorDto {
  @ApiProperty({ example: 'ООО "Поставщик"' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'SUPPLIER', enum: ['CUSTOMER', 'SUPPLIER', 'BOTH'] })
  @IsString()
  @IsIn(['CUSTOMER', 'SUPPLIER', 'BOTH'])
  type: string;

  @ApiProperty({ example: '7701234567', required: false })
  @IsString()
  @IsOptional()
  inn?: string;

  @ApiProperty({ example: '770101001', required: false })
  @IsString()
  @IsOptional()
  kpp?: string;

  @ApiProperty({ example: 'г. Москва, ул. Ленина, д. 1', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: '+7 (495) 123-45-67', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'supplier@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'Иванов Иван Иванович', required: false })
  @IsString()
  @IsOptional()
  contactPerson?: string;

  @ApiProperty({ example: true, required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
