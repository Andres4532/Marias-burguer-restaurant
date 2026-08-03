import { BadRequestException } from '@nestjs/common';
import { diskStorage, memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import {
  ALLOWED_IMAGE_MIMES,
  MAX_IMAGE_SIZE_BYTES,
  MIME_TO_EXT,
} from './uploads.constants';

export type UploadKind = 'products' | 'logos';

export function isCloudinaryUploadEnabled(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export function getUploadRootDir(): string {
  return process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads');
}

export function getUploadKindDir(kind: UploadKind): string {
  const dir = join(getUploadRootDir(), kind);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function createImageUploadOptions(kind: UploadKind) {
  return {
    limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
    fileFilter: (
      _req: Express.Request,
      file: Express.Multer.File,
      cb: (error: Error | null, acceptFile: boolean) => void,
    ) => {
      if (
        !ALLOWED_IMAGE_MIMES.includes(
          file.mimetype as (typeof ALLOWED_IMAGE_MIMES)[number],
        )
      ) {
        return cb(
          new BadRequestException(
            'Formato no permitido. Usa JPG, PNG o WebP.',
          ),
          false,
        );
      }
      cb(null, true);
    },
    storage: isCloudinaryUploadEnabled()
      ? memoryStorage()
      : diskStorage({
          destination: (_req, _file, cb) => {
            cb(null, getUploadKindDir(kind));
          },
          filename: (_req, file, cb) => {
            const ext =
              MIME_TO_EXT[file.mimetype] ??
              extname(file.originalname) ??
              '.jpg';
            cb(null, `${randomUUID()}${ext}`);
          },
        }),
  };
}
