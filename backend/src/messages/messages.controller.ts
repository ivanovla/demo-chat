import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { ListMessagesQuery, MessageDto, SendMessageBody } from './message.dto';
import { MessagesService } from './messages.service';

@Controller('conversations/:id/messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  list(
    @CurrentUser() me: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: ListMessagesQuery,
  ): Promise<{ items: MessageDto[]; hasMore: boolean }> {
    return this.messages.list(me.id, id, query.before, query.limit);
  }

  @Post()
  send(
    @CurrentUser() me: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: SendMessageBody,
  ): Promise<MessageDto> {
    return this.messages.send(me.id, id, body.text, body.clientId);
  }
}
