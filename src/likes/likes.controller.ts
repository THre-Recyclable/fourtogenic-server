// src/likes/likes.controller.ts
import {
  Body,
  Controller,
  Delete,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { CancelLikeQueryDto } from './dto/cancel-like-query.dto';
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
@Controller('likes')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @ApiOperation({ summary: '좋아요 추가' })
  addLike(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: CreateLikeDto,
  ) {
    const userId = req.user.sub;
    return this.likesService.addLike(userId, dto);
  }

  @Delete()
  @ApiOperation({
    summary:
      '좋아요 취소. 주의: like_id가 아니라 밑에 나오는 album 혹은 photo의 id를 넣어야 삭제됩니다.',
  })
  removeLike(
    @Req() req: Request & { user: JwtPayload },
    @Query() query: CancelLikeQueryDto,
  ) {
    const userId = req.user.sub;
    return this.likesService.removeLike(userId, query);
  }
}
