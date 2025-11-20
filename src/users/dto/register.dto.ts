// src/users/dto/register.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'runa' })
  username: string;

  @ApiProperty({ example: 'P@ssw0rd!' })
  password: string;

  @ApiProperty({ example: '루나', required: false })
  displayName?: string;
}
