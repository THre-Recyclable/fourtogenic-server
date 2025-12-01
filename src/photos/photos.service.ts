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
import { S3Service } from '../storage/s3.service';

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

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

    // 1) S3에 올릴 key 생성
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `photos/${ownerId}/${Date.now()}-${safeName}`;

    // 2) S3 업로드
    if (!file.buffer) {
      // 혹시 memoryStorage 안 썼는데도 여기 들어오면 에러
      throw new BadRequestException('파일 버퍼가 비어 있습니다.');
    }

    const fileUrl = await this.s3.uploadPublicFile({
      buffer: file.buffer,
      mimetype: file.mimetype,
      key,
    });

    // 3) DB 저장
    const photo = await this.prisma.photo.create({
      data: {
        ownerId,
        fileUrl, // 이제는 S3의 https://... URL
        title: body.title,
        description: body.description,
        visibility,
      },
    });

    // ===deprecated: 로컬 저장소용 코드 ===
    // 실제로 외부에서 접근 가능한 URL을 어떻게 만들지 정해야 함
    // 여기서는 /uploads 를 static으로 서빙한다고 가정
    /*
    const fileUrl = `/uploads/${file.filename}`;

    const photo = await this.prisma.photo.create({
      data: {
        ownerId,
        fileUrl,
        title: body.title,
        description: body.description,
        visibility,
      },
    });*/

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
      include: {
        _count: {
          select: { likes: true },
        },
      },
    });

    let nextCursor: string | null = null;
    if (photos.length > take) {
      const next = photos.pop(); // 마지막 하나 제거하고
      nextCursor = next!.id; // 그 id를 다음 커서로
    }

    return {
      items: photos.map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        fileUrl: p.fileUrl,
        title: p.title,
        description: p.description,
        visibility: p.visibility,
        isShared: p.isShared,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        likesCount: p._count.likes,
      })),
      nextCursor,
    };
  }

  // 사진 단일 조회 (권한 체크: 본인 or PUBLIC)
  async getPhotoById(photoId: string, requesterId?: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id: photoId },
      include: {
        _count: {
          select: { likes: true },
        },
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    const isOwner = requesterId && photo.ownerId === requesterId;
    const isVisible = photo.visibility === Visibility.PUBLIC;

    if (!isOwner && !isVisible) {
      throw new ForbiddenException('You cannot view this photo');
    }

    const { _count, ...rest } = photo;

    return {
      ...rest,
      likesCount: _count.likes,
    };
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

    // fileUrl이 http로 시작하면 S3라고 간주
    const fileUrl = photo.fileUrl || '';

    if (fileUrl.startsWith('http')) {
      // S3 객체 키 추출 (ex: https://.../photos/uid/xxx.png → /photos/uid/xxx.png)
      try {
        const url = new URL(fileUrl);
        const key = url.pathname.replace(/^\//, '');
        if (key) {
          await this.s3.deleteObject(key);
        }
      } catch (err) {
        console.error('Failed to parse S3 URL or delete:', fileUrl, err);
      }
    } else if (fileUrl.startsWith('/')) {
      // 옛날 로컬 /uploads/... 삭제 로직 유지
      const relativePath = fileUrl.replace(/^\//, '');
      const filePath = join(process.cwd(), relativePath);

      try {
        await fs.unlink(filePath);
      } catch (err: any) {
        if (err?.code !== 'ENOENT') {
          console.error('Failed to delete local file:', filePath, err);
        }
      }
    }

    // DB 레코드 삭제
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
