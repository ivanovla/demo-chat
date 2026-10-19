import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { ConversationDto, CreateConversationBody } from './conversation.dto';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@CurrentUser() me: AuthUser): Promise<ConversationDto[]> {
    return this.conversations.listFor(me.id);
  }

  @Post()
  create(
    @CurrentUser() me: AuthUser,
    @Body() body: CreateConversationBody,
  ): Promise<ConversationDto> {
    return this.conversations.findOrCreate(me.id, body.userId);
  }

  @Post(':id/read')
  @HttpCode(204)
  async read(
    @CurrentUser() me: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<void> {
    await this.conversations.markRead(id, me.id);
  }
}
