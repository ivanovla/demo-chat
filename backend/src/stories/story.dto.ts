import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { UserDto } from '../users/user.dto';

export interface StoryDto {
  id: string;
  userId: string;
  url: string;
  mimeType: string;
  durationMs: number;
  createdAt: string;
  expiresAt: string;
  seen: boolean;
}

export interface StoryGroupDto {
  user: UserDto;
  stories: StoryDto[];
}

export class CreateStoryBody {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(16000)
  durationMs = 0;
}
