import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Visibility } from '@prisma/client';

export class CreatePhotoBodyDto {
  @ApiPropertyOptional({ example: '여름 휴가 사진' })
  title?: string;

  @ApiPropertyOptional({ example: '2025년 여름에 바닷가에서 찍은 사진' })
  description?: string;

  @ApiPropertyOptional({
    enum: Visibility,
    example: Visibility.PRIVATE,
    description: 'PUBLIC / PRIVATE (기본값: PRIVATE)',
  })
  visibility?: Visibility;
}
