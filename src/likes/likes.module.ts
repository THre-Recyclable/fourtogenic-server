// src/likes/likes.module.ts
import { Module } from '@nestjs/common';
import { LikesService } from './likes.service';
import { LikesController } from './likes.controller';
import { MeLikesController } from './me-likes.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from 'src/users/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [LikesController, MeLikesController],
  providers: [LikesService, PrismaService],
  exports: [LikesService],
})
export class LikesModule {}
