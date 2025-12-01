//src/users.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { LikeTargetType } from '@prisma/client';
import { S3Service } from 'src/storage/s3.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly s3: S3Service,
  ) {}

  // ----------- Auth -------------

  async register(dto: RegisterDto) {
    const { email, username, password, displayName } = dto;

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('email or username already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: { email, username, passwordHash, displayName },
    });

    const accessToken = await this.signToken(user.id);

    const { passwordHash: _ph, ...safeUser } = user;
    return { user: safeUser, accessToken };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('invalid credentials');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('invalid credentials');
    }

    const accessToken = await this.signToken(user.id);
    const { passwordHash: _ph, ...safeUser } = user;
    return { user: safeUser, accessToken };
  }

  private async signToken(userId: string) {
    const payload = { sub: userId };
    return this.jwtService.signAsync(payload, {
      secret: jwtConstants.secret,
      expiresIn: '1h',
    });
  }

  // ----------- Profile -----------

  async getMe(userId: string) {
    return this.getProfileWithStats(userId, true);
  }

  async getPublicProfile(userId: string) {
    return this.getProfileWithStats(userId, false);
  }

  async updateMe(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File, // ✅ 파일 추가
  ) {
    let avatarUrl = dto.avatarUrl; // URL로 직접 세팅하는 것도 여전히 허용

    // 파일이 들어왔으면 파일 > S3 업로드가 우선
    if (file) {
      if (!file.buffer) {
        throw new BadRequestException('파일 버퍼가 비어 있습니다.');
      }

      const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const key = `avatars/${userId}/${Date.now()}-${safeName}`;

      avatarUrl = await this.s3.uploadPublicFile({
        buffer: file.buffer,
        mimetype: file.mimetype,
        key,
      });
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
        avatarUrl, // 파일이 있으면 새 URL, 없으면 dto.avatarUrl 사용
      },
    });

    const stats = await this.getStats(userId);

    const { passwordHash: _ph, ...safeUser } = user;
    return {
      ...safeUser,
      photoCount: stats.photoCount,
      receivedLikeCount: stats.receivedLikeCount,
    };
  }

  // 내부 helper들 ------------------

  private async getProfileWithStats(userId: string, includeEmail: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: includeEmail,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        passwordHash: false, // 어차피 빼고 싶으면 false
      },
    });

    if (!user) throw new NotFoundException('user not found');

    const stats = await this.getStats(userId);

    return {
      ...user,
      photoCount: stats.photoCount,
      receivedLikeCount: stats.receivedLikeCount,
    };
  }

  private async getStats(userId: string) {
    const [photoCount, receivedLikeCount] = await this.prisma.$transaction([
      this.prisma.photo.count({
        where: { ownerId: userId },
      }),
      this.prisma.like.count({
        where: {
          targetType: LikeTargetType.PHOTO,
          photo: { ownerId: userId },
        },
      }),
    ]);

    return { photoCount, receivedLikeCount };
  }
}
