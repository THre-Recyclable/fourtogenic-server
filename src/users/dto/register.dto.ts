// src/users/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'runa' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  @IsString()
  password: string;

  @ApiProperty({ example: '루나', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;
}
