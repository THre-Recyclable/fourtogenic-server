// src/albums/dto/create-album.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Visibility } from '@prisma/client';

export class CreateAlbumDto {
  @ApiProperty({ description: '앨범 제목', example: '여름 휴가 사진' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: '앨범 설명',
    example: '2025년 여름 부산 여행 사진 모음',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: Visibility,
    enumName: 'Visibility',
    description: '공개 범위 (기본값: PRIVATE)',
    required: false,
    example: Visibility.PRIVATE,
  })
  @IsEnum(Visibility)
  @IsOptional()
  visibility?: Visibility;
}
