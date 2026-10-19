import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { loadConfig } from '../config/config';
import { UsersModule } from '../users/users.module';
import { StoriesCleanupService } from './stories-cleanup.service';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { Story, StorySchema } from './story.schema';
import { storyMulterOptions } from './story-storage';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Story.name, schema: StorySchema }]),
    MulterModule.registerAsync({ useFactory: () => storyMulterOptions(loadConfig().uploadDir) }),
  ],
  controllers: [StoriesController],
  providers: [StoriesService, StoriesCleanupService],
})
export class StoriesModule {}
