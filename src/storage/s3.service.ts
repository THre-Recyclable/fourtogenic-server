import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private client: S3Client;
  private bucket: string;
  private baseUrl: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.S3_REGION,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!,
      },
    });
    this.bucket = process.env.S3_BUCKET!;
    this.baseUrl = process.env.S3_PUBLIC_BASE!; // https://bucket.s3.region.amazonaws.com
  }

  async uploadPublicFile(params: {
    buffer: Buffer;
    mimetype: string;
    key: string; // 예: photos/{userId}/{timestamp}-{originalname}
  }): Promise<string> {
    const { buffer, mimetype, key } = params;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimetype,
      }),
    );

    // 최종 접근 URL 반환
    return `${this.baseUrl}/${key}`;
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
