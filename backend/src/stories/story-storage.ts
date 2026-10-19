import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';

export const STORY_TTL_MS = 24 * 60 * 60 * 1000;
export const MAX_STORY_BYTES = 50 * 1024 * 1024;

export const storiesDir = (uploadDir: string) => join(uploadDir, 'stories');

export const baseMime = (mime: string) => mime.split(';')[0].trim().toLowerCase();

const EXTENSIONS: Record<string, string> = {
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/ogg': 'ogv',
};

export function storyMulterOptions(uploadDir: string): MulterOptions {
  const destination = storiesDir(uploadDir);
  mkdirSync(destination, { recursive: true });
  return {
    storage: diskStorage({
      destination,
      filename: (_req, file, cb) =>
        cb(null, `${randomUUID()}.${EXTENSIONS[baseMime(file.mimetype)]}`),
    }),
    limits: { fileSize: MAX_STORY_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (EXTENSIONS[baseMime(file.mimetype)]) cb(null, true);
      else cb(new BadRequestException('Only WebM, MP4, MOV or OGG videos are allowed'), false);
    },
  };
}
