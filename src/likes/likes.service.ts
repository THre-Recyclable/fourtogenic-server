// src/likes/likes.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { CancelLikeQueryDto } from './dto/cancel-like-query.dto';
import { MyLikesQueryDto } from './dto/my-likes-query.dto';
import { LikeTargetType, Prisma } from '@prisma/client';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async addLike(userId: string, dto: CreateLikeDto) {
    const { targetType, targetId } = dto;

    if (targetType === LikeTargetType.PHOTO) {
      return this.safeCreateLike({
        userId,
        targetType,
        photoId: targetId,
        albumId: null,
      });
    }

    if (targetType === LikeTargetType.ALBUM) {
      return this.safeCreateLike({
        userId,
        targetType,
        photoId: null,
        albumId: targetId,
      });
    }

    throw new BadRequestException('Invalid targetType');
  }

  private async safeCreateLike(data: {
    userId: string;
    targetType: LikeTargetType;
    photoId: string | null;
    albumId: string | null;
  }) {
    try {
      return await this.prisma.like.create({ data });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // 이미 좋아요가 있는 경우: idempotent 하게 처리
        return this.prisma.like.findFirst({
          where: {
            userId: data.userId,
            targetType: data.targetType,
            photoId: data.photoId ?? undefined,
            albumId: data.albumId ?? undefined,
          },
        });
      }
      throw err;
    }
  }

  async removeLike(userId: string, query: CancelLikeQueryDto) {
    const { target_type, target_id } = query;

    if (target_type === LikeTargetType.PHOTO) {
      await this.prisma.like.deleteMany({
        where: {
          userId,
          targetType: LikeTargetType.PHOTO,
          photoId: target_id,
        },
      });
      return { success: true };
    }

    if (target_type === LikeTargetType.ALBUM) {
      await this.prisma.like.deleteMany({
        where: {
          userId,
          targetType: LikeTargetType.ALBUM,
          albumId: target_id,
        },
      });
      return { success: true };
    }

    throw new BadRequestException('Invalid target_type');
  }

  async listMyLikes(userId: string, query: MyLikesQueryDto) {
    const limit = query.limit ?? 20;

    const where: Prisma.LikeWhereInput = {
      userId,
    };
    if (query.type) {
      where.targetType = query.type;
    }

    const likes = await this.prisma.like.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        photo: true,
        album: true,
      },
    });

    const hasNext = likes.length > limit;
    const items = hasNext ? likes.slice(0, limit) : likes;

    return {
      items: items.map((like) => ({
        like_id: like.id,
        targetType: like.targetType,
        createdAt: like.createdAt,
        photo: like.photo && {
          id: like.photo.id,
          fileUrl: like.photo.fileUrl,
          title: like.photo.title,
        },
        album: like.album && {
          id: like.album.id,
          title: like.album.title,
        },
      })),
      nextCursor: hasNext ? items[items.length - 1].id : null,
    };
  }
}
