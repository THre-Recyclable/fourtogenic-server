import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { Prisma } from '@prisma/client';
import { PhotosModule } from './photos/photos.module';
import { AlbumsModule } from './albums/albums.module';
import { LikesModule } from './likes/likes.module';
import { FeedModule } from './feed/feed.module';

@Module({
  imports: [UsersModule, PhotosModule, AlbumsModule, LikesModule, FeedModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
