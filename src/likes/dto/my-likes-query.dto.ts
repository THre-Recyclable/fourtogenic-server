// src/likes/dto/my-likes-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LikeTargetType } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MyLikesQueryDto {
  @ApiPropertyOptional({
    enum: LikeTargetType,
    description: 'PHOTO / ALBUM (생략 시 전체)',
  })
  @IsOptional()
  @IsEnum(LikeTargetType)
  type?: LikeTargetType;

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
    example: 'clzz123likeid',
    description: '커서 기반 페이지네이션용 마지막 like id',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
