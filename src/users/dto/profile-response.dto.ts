// src/users/dto/profile-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class MyProfileResponseDto {
  @ApiProperty({ example: 'clzz123abc456' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'runa' })
  username: string;

  @ApiProperty({ example: '루나', nullable: true })
  displayName: string | null;

  @ApiProperty({
    example: '사진 찍는 거 좋아하는 사람입니다.',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    example: '2025-11-20T13:20:15.123Z',
    description: '계정 생성 시각 (ISO 8601)',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-11-20T13:20:15.123Z',
    description: '계정 업데이트 시각 (ISO 8601)',
  })
  updatedAt: string;

  @ApiProperty({
    example: 12,
    description: '내가 올린 사진 수',
  })
  photoCount: number;

  @ApiProperty({
    example: 37,
    description: '내 사진들이 받은 좋아요 총합',
  })
  receivedLikeCount: number;
}

export class PublicProfileResponseDto {
  @ApiProperty({ example: 'clzz123abc456' })
  id: string;

  @ApiProperty({ example: 'runa' })
  username: string;

  @ApiProperty({ example: '루나', nullable: true })
  displayName: string | null;

  @ApiProperty({
    example: '사진 찍는 거 좋아하는 사람입니다.',
    nullable: true,
  })
  bio: string | null;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    nullable: true,
  })
  avatarUrl: string | null;

  @ApiProperty({
    example: '2025-11-20T13:20:15.123Z',
    description: '계정 생성 시각 (ISO 8601)',
  })
  createdAt: string;

  @ApiProperty({
    example: '2025-11-20T13:20:15.123Z',
    description: '계정 업데이트 시각 (ISO 8601)',
  })
  updatedAt: string;

  @ApiProperty({
    example: 8,
    description: '이 유저가 올린 사진 수',
  })
  photoCount: number;

  @ApiProperty({
    example: 21,
    description: '이 유저 사진들이 받은 좋아요 총합',
  })
  receivedLikeCount: number;
}
