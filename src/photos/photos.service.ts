import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePhotoBodyDto } from './dto/create-photo-body.dto';
import { Visibility } from '@prisma/client';
import { Express } from 'express';
import { MyPhotosQueryDto } from './dto/my-photos-query.dto';
import { AddToAlbumDto } from './dto/add-to-album.dto';
import * as fs from 'fs/promises';
import { join } from 'path';

@Injectable()
export class PhotosService {
  constructor(private readonly prisma: PrismaService) {}

  // 파일 업로드 + 메타 생성
  async createPhoto(
    ownerId: string,
    file: Express.Multer.File,
    body: CreatePhotoBodyDto,
  ) {
    if (!file) {
      throw new BadRequestException('파일이 필요합니다.');
    }

    const visibility = body.visibility ?? Visibility.PRIVATE;

    // 실제로 외부에서 접근 가능한 URL을 어떻게 만들지 정해야 함
    // 여기서는 /uploads 를 static으로 서빙한다고 가정
    const fileUrl = `/uploads/${file.filename}`;

    const photo = await this.prisma.photo.create({
      data: {
        ownerId,
        fileUrl,
        title: body.title,
        description: body.description,
        visibility,
      },
    });

    return photo;
  }

  // 내 사진 목록 (cursor 기반 페이지네이션)
  async getMyPhotos(ownerId: string, query: MyPhotosQueryDto) {
    const take = Math.min(query.limit ?? 20, 100);

    const where: any = { ownerId };
    if (query.visibility) {
      where.visibility = query.visibility;
    }

    const photos = await this.prisma.photo.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: take + 1, // 다음 페이지 여부 판단 위해 1개 더
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
    });

    let nextCursor: string | null = null;
    if (photos.length > take) {
      const next = photos.pop(); // 마지막 하나 제거하고
      nextCursor = next!.id; // 그 id를 다음 커서로
    }

    return {
      items: photos,
      nextCursor,
    };
  }

  // 사진 단일 조회 (권한 체크: 본인 or PUBLIC)
  async getPhotoById(photoId: string, requesterId?: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const isOwner = requesterId && photo.ownerId === requesterId;
    const isVisible = photo.visibility === Visibility.PUBLIC;

    if (!isOwner && !isVisible) {
      throw new ForbiddenException('You cannot view this photo');
    }

    return photo;
  }

  // 사진 삭제 (본인만)
  async deletePhoto(photoId: string, ownerId: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }
    if (photo.ownerId !== ownerId) {
      throw new ForbiddenException('You cannot delete this photo');
    }

    // 1) 실제 파일 경로 계산
    // fileUrl: "/uploads/1763811628031-339602577.jpg"
    // → 프로젝트 루트 기준: "<프로젝트루트>/uploads/1763811628031-339602577.jpg"
    const relativePath = (photo.fileUrl || '').replace(/^\//, ''); // 앞의 '/' 제거
    const filePath = join(process.cwd(), relativePath);

    // 2) 파일 삭제 시도 (없으면 에러 무시)
    try {
      await fs.unlink(filePath);
      // console.log('Deleted file:', filePath);
    } catch (err: any) {
      if (err?.code === 'ENOENT') {
        // 파일이 이미 없으면 그냥 무시
        // console.warn('File already missing:', filePath);
      } else {
        console.error('Failed to delete file:', filePath, err);
        // 여기서 에러를 그대로 throw 할지, 그냥 DB만 지울지는 취향
        // throw err;
      }
    }

    // 3) DB 레코드 삭제
    await this.prisma.photo.delete({
      where: { id: photoId },
    });

    return { success: true };
  }

  // 사진을 앨범에 추가
  async addPhotoToAlbum(photoId: string, ownerId: string, dto: AddToAlbumDto) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.ownerId !== ownerId) {
      throw new ForbiddenException('You cannot modify this photo');
    }

    const album = await this.prisma.album.findUnique({
      where: { id: dto.albumId },
    });
    if (!album) throw new NotFoundException('Album not found');
    if (album.ownerId !== ownerId) {
      throw new ForbiddenException('You cannot modify this album');
    }

    // 이미 존재하면 unique 제약 조건 때문에 에러가 날 수 있으니 try/catch
    try {
      const relation = await this.prisma.photosOnAlbums.create({
        data: {
          photoId,
          albumId: dto.albumId,
        },
      });
      return relation;
    } catch (e) {
      // 이미 추가된 경우 등
      throw new BadRequestException('Photo is already in this album');
    }
  }

  // 사진을 앨범에서 제거
  async removePhotoFromAlbum(
    photoId: string,
    ownerId: string,
    albumId: string,
  ) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });
    if (!photo) throw new NotFoundException('Photo not found');
    if (photo.ownerId !== ownerId) {
      throw new ForbiddenException('You cannot modify this photo');
    }

    const album = await this.prisma.album.findUnique({
      where: { id: albumId },
    });
    if (!album) throw new NotFoundException('Album not found');
    if (album.ownerId !== ownerId) {
      throw new ForbiddenException('You cannot modify this album');
    }

    const relation = await this.prisma.photosOnAlbums.findFirst({
      where: { photoId, albumId },
    });

    if (!relation) {
      throw new NotFoundException('Photo is not in this album');
    }

    await this.prisma.photosOnAlbums.delete({
      where: { id: relation.id },
    });

    return { success: true };
  }

  // 사진 공개 범위 변경
  async changePhotoVisibility(
    photoId: string,
    ownerId: string,
    visibility: Visibility,
  ) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (photo.ownerId !== ownerId) {
      throw new ForbiddenException(
        'You cannot change visibility of this photo',
      );
    }

    const updated = await this.prisma.photo.update({
      where: { id: photoId },
      data: { visibility },
    });

    return updated;
  }
}
