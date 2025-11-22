// src/albums/albums.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AlbumsService } from './albums.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { ListAlbumsQueryDto } from './dto/list-albums-query.dto';
import { AlbumPhotosQueryDto } from './dto/album-photos-query.dto';
import { Request } from 'express';
import { AuthGuard } from '../users/auth.guard';

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

@ApiTags('albums')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albumsService: AlbumsService) {}

  // 앨범 생성
  @Post()
  @ApiOperation({ summary: '앨범 생성' })
  createAlbum(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreateAlbumDto,
  ) {
    const userId = req.user.sub;
    return this.albumsService.createAlbum(userId, dto);
  }

  // 내 앨범 목록
  @Get()
  @ApiOperation({ summary: '내 앨범 목록' })
  listMyAlbums(
    @Req() req: Request & { user: JwtPayload },
    @Query() query: ListAlbumsQueryDto,
  ) {
    const userId = req.user.sub;
    return this.albumsService.listMyAlbums(userId, query);
  }

  // 앨범 단일 조회
  @Get(':albumId')
  @ApiOperation({ summary: '앨범 단일 조회' })
  getAlbum(
    @Req() req: Request & { user: JwtPayload },
    @Param('albumId') albumId: string,
  ) {
    const userId = req.user.sub;
    return this.albumsService.getAlbumById(albumId, userId);
  }

  // 앨범 삭제
  @Delete(':albumId')
  @ApiOperation({ summary: '앨범 삭제 (본인만)' })
  deleteAlbum(
    @Req() req: Request & { user: JwtPayload },
    @Param('albumId') albumId: string,
  ) {
    const userId = req.user.sub;
    return this.albumsService.deleteAlbum(albumId, userId);
  }

  // 앨범 정보 및 사진 목록
  @Get(':albumId/photos')
  @ApiOperation({ summary: '앨범 정보 및 사진 목록' })
  getAlbumPhotos(
    @Req() req: Request & { user: JwtPayload },
    @Param('albumId') albumId: string,
    @Query() query: AlbumPhotosQueryDto,
  ) {
    const userId = req.user.sub;
    return this.albumsService.getAlbumWithPhotos(albumId, userId, query);
  }
}
