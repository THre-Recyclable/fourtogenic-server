// src/feed/feed.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { PublicFeedQueryDto } from './dto/public-feed-query.dto';

@ApiTags('feed')
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('public')
  @ApiOperation({
    summary: '공개 피드 확인',
    description: '/feed/public?sort=latest|likes&limit&cursor',
  })
  getPublicFeed(@Query() query: PublicFeedQueryDto) {
    return this.feedService.getPublicFeed(query);
  }
}
