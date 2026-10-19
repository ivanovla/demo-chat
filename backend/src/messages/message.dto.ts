import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  clientId?: string;
  createdAt: string;
}

export class SendMessageBody {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @MaxLength(4000, { message: 'Message is too long (max 4000 characters)' })
  text: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  clientId?: string;
}

export class SendMessagePayload extends SendMessageBody {
  @IsMongoId({ message: 'Invalid conversation id' })
  conversationId: string;
}

export class ListMessagesQuery {
  @IsOptional()
  @IsMongoId()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 30;
}
