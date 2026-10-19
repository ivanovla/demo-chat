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

function extensionFor(mime: string): string {
  const base = baseMime(mime);
  if (base.includes('mp4')) return 'mp4';
  if (base.includes('quicktime')) return 'mov';
  if (base.includes('ogg')) return 'ogv';
  return 'webm';
}

export function storyMulterOptions(uploadDir: string): MulterOptions {
  const destination = storiesDir(uploadDir);
  mkdirSync(destination, { recursive: true });
  return {
    storage: diskStorage({
      destination,
      filename: (_req, file, cb) => cb(null, `${randomUUID()}.${extensionFor(file.mimetype)}`),
    }),
    limits: { fileSize: MAX_STORY_BYTES, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (baseMime(file.mimetype).startsWith('video/')) cb(null, true);
      else cb(new BadRequestException('Only video files are allowed'), false);
    },
  };
}
