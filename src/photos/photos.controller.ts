import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { PhotosService } from './photos.service';
import { CreatePhotoBodyDto } from './dto/create-photo-body.dto';
import { MyPhotosQueryDto } from './dto/my-photos-query.dto';
import { AddToAlbumDto } from './dto/add-to-album.dto';
import { AuthGuard } from '../users/auth.guard';
import { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Visibility } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangePhotoVisibilityDto } from './dto/change-photo-visibility.dto';
import * as multer from 'multer';

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

@ApiTags('Photos')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard) // 이 컨트롤러 전체에 JWT 필요
@Controller()
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  // 사진 업로드: multipart/form-data + file
  @Post('photos')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(),
    }),
  )
  @ApiOperation({ summary: '사진 업로드 & 메타 생성 (파일 업로드)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: '업로드할 파일과 메타 정보',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: { type: 'string', example: '여름 휴가 사진' },
        description: {
          type: 'string',
          example: '2025년 여름에 바닷가에서 찍은 사진',
        },
        visibility: {
          type: 'string',
          enum: Object.values(Visibility),
          example: Visibility.PRIVATE,
        },
      },
      required: ['file'],
    },
  })
  @ApiCreatedResponse({ description: '새 사진이 생성되었습니다.' })
  @ApiUnauthorizedResponse({ description: 'JWT 필요' })
  createPhoto(
    @Req() req: Request & { user: JwtPayload },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreatePhotoBodyDto,
  ) {
    const userId = req.user.sub;
    return this.photosService.createPhoto(userId, file, body);
  }

  // 내 사진 목록
  @Get('photos')
  @ApiOperation({ summary: '내 사진 목록 조회 (cursor 페이징)' })
  @ApiOkResponse({
    description: 'items: 사진 배열, nextCursor: 다음 페이지 커서 (없으면 null)',
  })
  getMyPhotos(
    @Req() req: Request & { user: JwtPayload },
    @Query() query: MyPhotosQueryDto,
  ) {
    const userId = req.user.sub;

    // limit, visibility 파싱 (Query는 string이라서)
    const parsed: MyPhotosQueryDto = {
      ...query,
      limit: query.limit ? Number(query.limit) : undefined,
      visibility: query.visibility as Visibility | undefined,
    };

    return this.photosService.getMyPhotos(userId, parsed);
  }

  // 사진 단일 조회
  @Get('photos/:photoId')
  @ApiOperation({
    summary: '사진 단일 조회 (본인 사진 or PUBLIC 사진만 접근 가능)',
  })
  @ApiOkResponse({ description: '사진 정보' })
  @ApiNotFoundResponse({ description: '사진이 존재하지 않음' })
  getPhotoById(
    @Req() req: Request & { user: JwtPayload },
    @Param('photoId') photoId: string,
  ) {
    const userId = req.user.sub;
    return this.photosService.getPhotoById(photoId, userId);
  }

  // 사진 삭제
  @Delete('photos/:photoId')
  @ApiOperation({ summary: '사진 삭제 (본인만 가능)' })
  @ApiOkResponse({ description: '삭제 성공 여부 반환' })
  deletePhoto(
    @Req() req: Request & { user: JwtPayload },
    @Param('photoId') photoId: string,
  ) {
    const userId = req.user.sub;
    return this.photosService.deletePhoto(photoId, userId);
  }

  // 사진을 앨범에 추가
  @Post('photos/:photoId/albums')
  @ApiOperation({ summary: '사진을 앨범에 추가' })
  @ApiOkResponse({ description: '사진-앨범 관계가 생성됨' })
  @ApiBadRequestResponse({ description: '이미 앨범에 존재하는 경우 등' })
  addPhotoToAlbum(
    @Req() req: Request & { user: JwtPayload },
    @Param('photoId') photoId: string,
    @Body() dto: AddToAlbumDto,
  ) {
    const userId = req.user.sub;
    return this.photosService.addPhotoToAlbum(photoId, userId, dto);
  }

  // 사진을 앨범에서 제거
  // /photos/{photo_id}/albums?album_id=...
  @Delete('photos/:photoId/albums')
  @ApiOperation({ summary: '사진을 앨범에서 제거' })
  @ApiOkResponse({ description: '제거 성공 여부 반환' })
  removePhotoFromAlbum(
    @Req() req: Request & { user: JwtPayload },
    @Param('photoId') photoId: string,
    @Query('album_id') albumId: string,
  ) {
    const userId = req.user.sub;
    return this.photosService.removePhotoFromAlbum(photoId, userId, albumId);
  }

  // 사진 공개 범위 변경 (PUBLIC / PRIVATE)
  @Patch('photos/:photoId/visibility')
  @ApiOperation({ summary: '사진 공개 범위 변경 (PUBLIC / PRIVATE)' })
  @ApiOkResponse({ description: '변경된 사진 정보' })
  @ApiBody({ type: ChangePhotoVisibilityDto })
  changePhotoVisibility(
    @Req() req: Request & { user: JwtPayload },
    @Param('photoId') photoId: string,
    @Body() body: ChangePhotoVisibilityDto,
  ) {
    const userId = req.user.sub;
    const { visibility } = body; // 'PUBLIC' 또는 'PRIVATE'
    return this.photosService.changePhotoVisibility(
      photoId,
      userId,
      visibility,
    );
  }
}
