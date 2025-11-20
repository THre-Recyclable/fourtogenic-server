// src/users/dto/update-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: '루나', required: false })
  displayName?: string;

  @ApiProperty({ example: '사진 찍는 거 좋아하는 사람', required: false })
  bio?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    required: false,
  })
  avatarUrl?: string;
}
