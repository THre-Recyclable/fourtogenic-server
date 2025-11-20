// src/users/users.controller.ts
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthGuard } from './auth.guard';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

interface JwtPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

@ApiTags('Users') // 이 컨트롤러 전체에 붙는 태그 이름
@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ------- Auth -------

  @Post('auth/register')
  @ApiOperation({ summary: '회원가입' })
  @ApiCreatedResponse({ description: '회원가입 성공' })
  @ApiBadRequestResponse({ description: '이미 존재하는 이메일/유저명' })
  register(@Body() dto: RegisterDto) {
    return this.usersService.register(dto);
  }

  @Post('auth/login')
  @ApiOperation({ summary: '로그인' })
  @ApiOkResponse({ description: '로그인 성공, 액세스 토큰 반환' })
  @ApiUnauthorizedResponse({ description: '이메일 또는 비밀번호 불일치' })
  login(@Body() dto: LoginDto) {
    return this.usersService.login(dto);
  }

  // ------- Profile -------

  @UseGuards(AuthGuard)
  @Get('users/me')
  @ApiOperation({ summary: '내 프로필 조회' })
  @ApiBearerAuth('access-token') // 위 DocumentBuilder에서 쓴 이름
  @ApiOkResponse({
    description: '내 프로필 정보 + 사진 수 + 받은 좋아요 수',
  })
  getMe(@Req() req: Request & { user: JwtPayload }) {
    const userId = req.user.sub;
    return this.usersService.getMe(userId);
  }

  @UseGuards(AuthGuard)
  @Patch('users/me')
  @ApiOperation({ summary: '내 프로필 수정' })
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ description: '수정된 프로필 반환' })
  updateMe(
    @Req() req: Request & { user: JwtPayload },
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user.sub;
    return this.usersService.updateMe(userId, dto);
  }

  @Get('users/:id')
  @ApiOperation({ summary: '공개 프로필 조회' })
  @ApiOkResponse({
    description: '해당 유저의 공개 프로필 + 사진/좋아요 수',
  })
  getPublicProfile(@Param('id') id: string) {
    return this.usersService.getPublicProfile(id);
  }
}
