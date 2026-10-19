import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Interval } from '@nestjs/schedule';
import { readdir, rm, stat } from 'fs/promises';
import { Model } from 'mongoose';
import { join } from 'path';
import { loadConfig } from '../config/config';
import { Story } from './story.schema';
import { storiesDir } from './story-storage';

const ORPHAN_GRACE_MS = 60 * 60 * 1000;

@Injectable()
export class StoriesCleanupService implements OnApplicationBootstrap {
  private readonly logger = new Logger(StoriesCleanupService.name);
  private readonly dir = storiesDir(loadConfig().uploadDir);

  constructor(@InjectModel(Story.name) private readonly stories: Model<Story>) {}

  onApplicationBootstrap() {
    void this.run();
  }

  @Interval(10 * 60 * 1000)
  run() {
    return this.cleanup().catch((err) => this.logger.error(err));
  }

  async cleanup(): Promise<void> {
    const expired = await this.stories
      .find({ expiresAt: { $lte: new Date() } }, { filename: 1 })
      .exec();
    await Promise.all(expired.map((s) => rm(join(this.dir, s.filename), { force: true })));
    if (expired.length)
      await this.stories.deleteMany({ _id: { $in: expired.map((s) => s._id) } }).exec();

    const files = await readdir(this.dir).catch(() => [] as string[]);
    const known = new Set(
      (await this.stories.find({}, { filename: 1 }).exec()).map((s) => s.filename),
    );
    const cutoff = Date.now() - ORPHAN_GRACE_MS;
    for (const name of files) {
      if (known.has(name)) continue;
      const path = join(this.dir, name);
      const info = await stat(path).catch(() => null);
      if (info && info.mtimeMs < cutoff) await rm(path, { force: true });
    }

    if (expired.length) this.logger.log(`Removed ${expired.length} expired stories`);
  }
}
