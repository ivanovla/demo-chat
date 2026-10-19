import { resolve } from 'path';

export interface AppConfig {
  port: number;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  uploadDir: string;
}

export function loadConfig(): AppConfig {
  const production = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET ?? (production ? '' : 'dev-secret-change-me');
  if (!jwtSecret) throw new Error('JWT_SECRET is required');

  return {
    port: Number(process.env.PORT ?? 3000),
    mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/chat',
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
    uploadDir: resolve(process.env.UPLOAD_DIR ?? 'uploads'),
  };
}
