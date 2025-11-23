// src/users/dto/update-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: '루나', required: false })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({ example: '사진 찍는 거 좋아하는 사람', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
