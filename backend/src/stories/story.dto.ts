import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
export type { StoryDto, StoryGroupDto } from '@chat/contracts';

export class CreateStoryBody {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(16000)
  durationMs = 0;
}
