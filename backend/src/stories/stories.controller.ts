import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { CreateStoryBody, StoryDto, StoryGroupDto } from './story.dto';
import { StoriesService } from './stories.service';

@Controller('stories')
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get()
  feed(@CurrentUser() me: AuthUser): Promise<StoryGroupDto[]> {
    return this.stories.feed(me.id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('video'))
  create(
    @CurrentUser() me: AuthUser,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: CreateStoryBody,
  ): Promise<StoryDto> {
    if (!file) throw new BadRequestException('Video file is required');
    return this.stories.create(me.id, file, body.durationMs);
  }

  @Post(':id/view')
  @HttpCode(204)
  view(@CurrentUser() me: AuthUser, @Param('id', ParseObjectIdPipe) id: string): Promise<void> {
    return this.stories.markViewed(me.id, id);
  }
}
