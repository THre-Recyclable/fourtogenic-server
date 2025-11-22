// src/albums/dto/list-albums-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Visibility } from '@prisma/client';

export class ListAlbumsQueryDto {
  @ApiPropertyOptional({ description: '한 번에 가져올 개수', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: '다음 페이지를 위한 cursor (마지막 앨범 id)',
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({
    enum: Visibility,
    enumName: 'Visibility',
    description: 'PUBLIC / PRIVATE 필터 (없으면 둘 다)',
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
