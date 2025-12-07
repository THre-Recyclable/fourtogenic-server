// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { jwtConstants } from './constants';
import { S3Service } from 'src/storage/s3.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService, PrismaService, S3Service],
  exports: [UsersService],
})
export class UsersModule {}
