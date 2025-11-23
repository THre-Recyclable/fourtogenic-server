import { ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MyPhotosQueryDto {
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

  @ApiPropertyOptional({
    enum: Visibility,
    description: 'PUBLIC / PRIVATE 필터 (생략 시 전체)',
  })
  @IsOptional()
  @IsEnum(Visibility)
  visibility?: Visibility;
}
