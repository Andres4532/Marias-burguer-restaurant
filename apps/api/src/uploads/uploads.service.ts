import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  getUploadKindDir,
  getUploadRootDir,
  type UploadKind,
} from './uploads.config';

@Injectable()
export class UploadsService {
  readonly uploadDir: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') ?? getUploadRootDir();
    const port = this.config.get<string>('API_PORT') ?? '3001';
    const raw =
      this.config.get<string>('API_PUBLIC_URL') ??
      `http://localhost:${port}`;
    this.publicUrl = raw.replace(/\/+$/, '');

    for (const kind of ['products', 'logos'] as UploadKind[]) {
      getUploadKindDir(kind);
    }
  }

  getKindDir(kind: UploadKind): string {
    return getUploadKindDir(kind);
  }

  buildFileUrl(kind: UploadKind, filename: string): string {
    return `${this.publicUrl}/api/v1/uploads/files/${kind}/${filename}`;
  }
}
