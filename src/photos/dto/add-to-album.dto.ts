import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddToAlbumDto {
  @ApiProperty({ example: 'clzz123albumid' })
  @IsString()
  @IsNotEmpty()
  albumId: string;
}
