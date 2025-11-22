import { ApiProperty } from '@nestjs/swagger';

export class AddToAlbumDto {
  @ApiProperty({ example: 'clzz123albumid' })
  albumId: string;
}
