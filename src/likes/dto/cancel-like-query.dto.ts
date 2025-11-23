// src/likes/dto/cancel-like-query.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { LikeTargetType } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CancelLikeQueryDto {
  @ApiProperty({ enum: LikeTargetType, example: LikeTargetType.PHOTO })
  @IsEnum(LikeTargetType)
  target_type: LikeTargetType;

  @ApiProperty({ example: 'clzz123photoid' })
  @IsString()
  target_id: string;
}
