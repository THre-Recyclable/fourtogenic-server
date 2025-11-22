// src/albums/dto/album-photos-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AlbumPhotosQueryDto {
  @ApiPropertyOptional({ description: '한 번에 가져올 개수', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: '다음 페이지를 위한 cursor (PhotosOnAlbums.id)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    description: '정렬 기준 (recent: 최신순, oldest: 오래된 순)',
    default: 'recent',
  })
  @IsOptional()
  @IsIn(['recent', 'oldest'])
  sort?: 'recent' | 'oldest';
}
