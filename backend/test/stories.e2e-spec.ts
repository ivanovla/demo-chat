import { existsSync, readdirSync, writeFileSync, utimesSync } from 'fs';
import { join } from 'path';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Story } from '../src/stories/story.schema';
import { StoriesCleanupService } from '../src/stories/stories-cleanup.service';
import { bearer, createTestApp, registerUser, TestContext, TestUser } from './helpers';

describe('Stories', () => {
  let ctx: TestContext;
  let a: TestUser;
  let b: TestUser;

  beforeAll(async () => {
    ctx = await createTestApp();
    a = await registerUser(ctx);
    b = await registerUser(ctx);
  });

  afterAll(() => ctx.close());

  const upload = (u: TestUser, contentType = 'video/webm', filename = 'clip.webm') =>
    ctx.http
      .post('/api/stories')
      .set(bearer(u))
      .field('durationMs', '5200')
      .attach('video', Buffer.from('fake-video-bytes'), { filename, contentType });

  it('uploads a story video and serves it', async () => {
    const res = await upload(a, 'video/webm;codecs=vp9').expect(201);
    expect(res.body).toMatchObject({
      userId: a.user.id,
      mimeType: 'video/webm',
      durationMs: 5200,
      seen: true,
    });
    expect(res.body.url).toMatch(/^\/media\/stories\/[\w-]+\.webm$/);
    expect(new Date(res.body.expiresAt).getTime() - new Date(res.body.createdAt).getTime()).toBe(
      24 * 60 * 60 * 1000,
    );

    const file = await ctx.http.get(res.body.url).expect(200);
    expect(file.headers['content-type']).toContain('video/webm');
  });

  it('rejects non-video uploads and missing files', async () => {
    await upload(a, 'image/png', 'pic.png').expect(400);
    await ctx.http.post('/api/stories').set(bearer(a)).field('durationMs', '1000').expect(400);
  });

  it('returns active stories grouped by user, mine first', async () => {
    await upload(b, 'video/mp4', 'clip.mp4').expect(201);
    const feed = (await ctx.http.get('/api/stories').set(bearer(b)).expect(200)).body;

    expect(feed.map((g: { user: { id: string } }) => g.user.id)).toEqual([b.user.id, a.user.id]);
    expect(feed[0].stories[0].url).toMatch(/\.mp4$/);
    expect(feed[1].stories).toHaveLength(1);
    expect(feed[1].stories[0].seen).toBe(false);
  });

  it('marks a story as seen', async () => {
    const feed = (await ctx.http.get('/api/stories').set(bearer(b)).expect(200)).body;
    const storyId = feed[1].stories[0].id;
    await ctx.http.post(`/api/stories/${storyId}/view`).set(bearer(b)).expect(204);
    const after = (await ctx.http.get('/api/stories').set(bearer(b)).expect(200)).body;
    expect(after[1].stories[0].seen).toBe(true);
    await ctx.http.post(`/api/stories/${new Types.ObjectId()}/view`).set(bearer(b)).expect(404);
  });

  it('hides expired stories and cleans them up with their files', async () => {
    const stories = ctx.app.get<Model<Story>>(getModelToken(Story.name));
    const dir = join(ctx.uploadDir, 'stories');
    writeFileSync(join(dir, 'old.webm'), 'x');
    const expired = await stories.create({
      userId: new Types.ObjectId(a.user.id),
      filename: 'old.webm',
      mimeType: 'video/webm',
      size: 1,
      durationMs: 1000,
      expiresAt: new Date(Date.now() - 1000),
    });
    const orphan = join(dir, 'orphan.webm');
    writeFileSync(orphan, 'x');
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    utimesSync(orphan, twoHoursAgo, twoHoursAgo);

    const feed = (await ctx.http.get('/api/stories').set(bearer(b)).expect(200)).body;
    const ids = feed.flatMap((g: { stories: { id: string }[] }) => g.stories.map((s) => s.id));
    expect(ids).not.toContain(expired.id);

    await ctx.app.get(StoriesCleanupService).cleanup();

    expect(await stories.exists({ _id: expired._id })).toBeNull();
    expect(existsSync(join(dir, 'old.webm'))).toBe(false);
    expect(existsSync(orphan)).toBe(false);
    expect(readdirSync(dir)).toHaveLength(2);
  });
});
