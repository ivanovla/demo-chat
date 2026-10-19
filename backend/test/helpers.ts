import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

export interface TestContext {
  app: NestExpressApplication;
  http: ReturnType<typeof request>;
  uploadDir: string;
  url: string;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestContext> {
  const mongo = await MongoMemoryServer.create();
  const uploadDir = mkdtempSync(join(tmpdir(), 'chat-uploads-'));
  process.env.MONGO_URI = mongo.getUri('chat-test');
  process.env.JWT_SECRET = 'test-secret';
  process.env.UPLOAD_DIR = uploadDir;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(app);
  await app.listen(0);
  const url = await app.getUrl();

  return {
    app,
    http: request(app.getHttpServer()),
    uploadDir,
    url: url.replace('[::1]', 'localhost'),
    close: async () => {
      await app.close();
      await mongo.stop();
      rmSync(uploadDir, { recursive: true, force: true });
    },
  };
}

let seq = 0;

export interface TestUser {
  token: string;
  user: { id: string; username: string; email: string };
}

export async function registerUser(ctx: TestContext, name?: string): Promise<TestUser> {
  seq += 1;
  const username = name ?? `user_${seq}_${Math.floor(Math.random() * 1e5)}`;
  const res = await ctx.http
    .post('/api/auth/register')
    .send({ email: `${username}@test.dev`, username, password: 'password123' })
    .expect(201);
  return { token: res.body.accessToken, user: res.body.user };
}

export const bearer = (u: TestUser) => ({ Authorization: `Bearer ${u.token}` });
