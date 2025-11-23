// src/likes/me-likes.controller.ts
import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { MyLikesQueryDto } from './dto/my-likes-query.dto';
import { Request } from 'express';
import { AuthGuard } from '../users/auth.guard';

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

@ApiTags('likes')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard)
@Controller('me')
export class MeLikesController {
  constructor(private readonly likesService: LikesService) {}

  @Get('likes')
  @ApiOperation({ summary: '좋아요 목록' })
  getMyLikes(
    @Req() req: Request & { user: JwtPayload },
    @Query() query: MyLikesQueryDto,
  ) {
    const userId = req.user.sub;
    return this.likesService.listMyLikes(userId, query);
  }
}
