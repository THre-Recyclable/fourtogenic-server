// src/feed/dto/public-feed-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PublicFeedSort {
  LATEST = 'latest',
  LIKES = 'likes',
}

export class PublicFeedQueryDto {
  @ApiPropertyOptional({
    enum: PublicFeedSort,
    example: PublicFeedSort.LATEST,
    description: 'latest | likes (기본 latest)',
  })
  @IsOptional()
  @IsEnum(PublicFeedSort)
  sort?: PublicFeedSort;

  @ApiPropertyOptional({
    example: 20,
    description: '한 번에 가져올 개수 (기본 20, 최대 100)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    example: 'clzz123photoid',
    description: '커서 기반 페이지네이션용 마지막 photo id',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
