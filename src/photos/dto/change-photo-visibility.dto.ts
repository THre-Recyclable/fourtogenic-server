import { ApiProperty } from '@nestjs/swagger';
import { Visibility } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class ChangePhotoVisibilityDto {
  @ApiProperty({
    enum: Visibility,
    enumName: 'Visibility',
    description: '사진 공개 범위 (PUBLIC 또는 PRIVATE)',
    example: Visibility.PUBLIC,
  })
  @IsEnum(Visibility)
  visibility: Visibility;
}
