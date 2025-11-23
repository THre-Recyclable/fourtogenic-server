// feed.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PublicFeedQueryDto,
  PublicFeedSort,
} from './dto/public-feed-query.dto';
import { Prisma, Visibility } from '@prisma/client';

@Injectable()
export class FeedService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicFeed(query: PublicFeedQueryDto) {
    const limit = query.limit ?? 20;
    const sort = query.sort ?? PublicFeedSort.LATEST;

    const where: Prisma.PhotoWhereInput = {
      visibility: Visibility.PUBLIC,
    };

    let orderBy: Prisma.PhotoOrderByWithRelationInput;
    if (sort === PublicFeedSort.LIKES) {
      orderBy = {
        likes: {
          _count: 'desc',
        },
      };
    } else {
      orderBy = {
        createdAt: 'desc',
      };
    }

    const photos = await this.prisma.photo.findMany({
      where,
      take: limit + 1,
      cursor: query.cursor ? { id: query.cursor } : undefined,
      skip: query.cursor ? 1 : 0,
      orderBy,
      include: {
        _count: {
          select: { likes: true },
        },
      },
    });

    const hasNext = photos.length > limit;
    const items = hasNext ? photos.slice(0, limit) : photos;

    return {
      items: items.map((p) => ({
        id: p.id,
        fileUrl: p.fileUrl,
        title: p.title,
        createdAt: p.createdAt,
        likesCount: p._count.likes,
      })),
      nextCursor: hasNext ? items[items.length - 1].id : null,
    };
  }
}
