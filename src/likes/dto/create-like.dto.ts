// src/likes/dto/create-like.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { LikeTargetType } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateLikeDto {
  @ApiProperty({ enum: LikeTargetType, example: LikeTargetType.PHOTO })
  @IsEnum(LikeTargetType)
  targetType: LikeTargetType;

  @ApiProperty({ example: 'clzz123photoid' })
  @IsString()
  targetId: string;
}
