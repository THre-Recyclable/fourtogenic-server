import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { Prisma } from '@prisma/client';
import { PhotosModule } from './photos/photos.module';
import { AlbumsModule } from './albums/albums.module';

@Module({
  imports: [UsersModule, PhotosModule, AlbumsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
