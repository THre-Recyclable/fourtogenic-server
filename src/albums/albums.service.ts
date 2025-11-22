// src/albums/albums.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAlbumDto } from './dto/create-album.dto';
import { ListAlbumsQueryDto } from './dto/list-albums-query.dto';
import { AlbumPhotosQueryDto } from './dto/album-photos-query.dto';
import { Visibility } from '@prisma/client';

@Injectable()
export class AlbumsService {
  constructor(private readonly prisma: PrismaService) {}

  // 앨범 생성
  async createAlbum(ownerId: string, dto: CreateAlbumDto) {
    return this.prisma.album.create({
      data: {
        ownerId,
        title: dto.title,
        description: dto.description,
        visibility: dto.visibility ?? Visibility.PRIVATE,
      },
    });
  }

  // 내 앨범 목록
  async listMyAlbums(ownerId: string, query: ListAlbumsQueryDto) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor;

    const where: any = { ownerId };
    if (query.visibility) {
      where.visibility = query.visibility;
    }

    const albums = await this.prisma.album.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    let nextCursor: string | null = null;
    if (albums.length > limit) {
      const next = albums.pop();
      nextCursor = next!.id;
    }

    return {
      items: albums,
      nextCursor,
    };
  }

  // 앨범 단일 조회 (소유자거나 PUBLIC 인 경우만)
  async getAlbumById(albumId: string, currentUserId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) throw new NotFoundException('Album not found');

    if (
      album.ownerId !== currentUserId &&
      album.visibility !== Visibility.PUBLIC
    ) {
      throw new ForbiddenException('You cannot view this album');
    }

    return album;
  }

  // 앨범 삭제 (본인만) + 조인 테이블 정리
  async deleteAlbum(albumId: string, ownerId: string) {
    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) throw new NotFoundException('Album not found');
    if (album.ownerId !== ownerId) {
      throw new ForbiddenException('You cannot delete this album');
    }

    // PhotosOnAlbums 먼저 삭제
    await this.prisma.photosOnAlbums.deleteMany({
      where: { albumId },
    });

    await this.prisma.album.delete({
      where: { id: albumId },
    });

    return { success: true };
  }

  // 앨범 정보 + 사진 목록
  async getAlbumWithPhotos(
    albumId: string,
    currentUserId: string,
    query: AlbumPhotosQueryDto,
  ) {
    const limit = query.limit ?? 20;
    const cursor = query.cursor;
    const sort = query.sort ?? 'recent';

    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });

    if (!album) throw new NotFoundException('Album not found');

    const isOwner = album.ownerId === currentUserId;

    if (!isOwner && album.visibility !== Visibility.PUBLIC) {
      throw new ForbiddenException('You cannot view this album');
    }

    const orderBy = { addedAt: sort === 'recent' ? 'desc' : 'asc' } as const;

    const photosOnAlbums = await this.prisma.photosOnAlbums.findMany({
      where: {
        albumId,
        ...(isOwner
          ? {}
          : {
              photo: { visibility: Visibility.PUBLIC }, // 남이 볼 땐 PUBLIC 사진만
            }),
      },
      include: {
        photo: true,
      },
      orderBy,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    let nextCursor: string | null = null;
    if (photosOnAlbums.length > limit) {
      const next = photosOnAlbums.pop();
      nextCursor = next!.id; // PhotosOnAlbums.id
    }

    return {
      album,
      photos: photosOnAlbums.map((poa) => poa.photo),
      nextCursor,
    };
  }
}
