import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadKind } from './uploads.config';

@Injectable()
export class CloudinaryService {
  readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET');
    this.enabled = Boolean(cloudName && apiKey && apiSecret);

    if (this.enabled) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
    }
  }

  uploadImage(buffer: Buffer, kind: UploadKind): Promise<string> {
    const folder =
      this.config.get<string>('CLOUDINARY_FOLDER') ?? 'restaurante-pos';

    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `${folder}/${kind}`,
            resource_type: 'image',
          },
          (error, result) => {
            if (error || !result?.secure_url) {
              reject(error ?? new Error('Cloudinary no devolvió URL'));
              return;
            }
            resolve(result.secure_url);
          },
        )
        .end(buffer);
    });
  }
}
