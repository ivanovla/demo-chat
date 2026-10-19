import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RealtimeService } from '../realtime/realtime.service';
import { UsersService } from '../users/users.service';
import { StoryDto, StoryGroupDto } from './story.dto';
import { Story, StoryDocument } from './story.schema';
import { baseMime, STORY_TTL_MS } from './story-storage';

@Injectable()
export class StoriesService {
  constructor(
    @InjectModel(Story.name) private readonly stories: Model<Story>,
    private readonly users: UsersService,
    private readonly realtime: RealtimeService,
  ) {}

  async create(meId: string, file: Express.Multer.File, durationMs: number): Promise<StoryDto> {
    const now = Date.now();
    const story = await this.stories.create({
      userId: new Types.ObjectId(meId),
      filename: file.filename,
      mimeType: baseMime(file.mimetype),
      size: file.size,
      durationMs,
      createdAt: new Date(now),
      expiresAt: new Date(now + STORY_TTL_MS),
    });
    this.realtime.broadcast('story:new', { userId: meId });
    return this.toDto(story, meId);
  }

  async feed(meId: string): Promise<StoryGroupDto[]> {
    const active = await this.stories
      .find({ expiresAt: { $gt: new Date() } })
      .sort({ createdAt: 1 })
      .exec();

    const byUser = new Map<string, StoryDocument[]>();
    for (const s of active) {
      const key = s.userId.toString();
      byUser.set(key, [...(byUser.get(key) ?? []), s]);
    }

    const users = await this.users.findByIds([...byUser.keys()]);
    const latest = (id: string) => byUser.get(id)!.at(-1)!.createdAt.getTime();
    return users
      .sort((x, y) => (x.id === meId ? -1 : y.id === meId ? 1 : latest(y.id) - latest(x.id)))
      .map((user) => ({
        user: this.users.toDto(user),
        stories: byUser.get(user.id)!.map((s) => this.toDto(s, meId)),
      }));
  }

  async markViewed(meId: string, storyId: string): Promise<void> {
    const res = await this.stories
      .updateOne(
        { _id: storyId, expiresAt: { $gt: new Date() } },
        { $addToSet: { viewers: new Types.ObjectId(meId) } },
      )
      .exec();
    if (!res.matchedCount) throw new NotFoundException('Story not found or expired');
  }

  private toDto(s: StoryDocument, meId: string): StoryDto {
    const own = s.userId.equals(meId);
    return {
      id: s.id,
      userId: s.userId.toString(),
      url: `/media/stories/${s.filename}`,
      mimeType: s.mimeType,
      durationMs: s.durationMs,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      seen: own || s.viewers.some((v) => v.equals(meId)),
    };
  }
}
