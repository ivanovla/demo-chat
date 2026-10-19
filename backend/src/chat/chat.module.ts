import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { MessagesModule } from '../messages/messages.module';
import { ChatGateway } from './chat.gateway';

@Module({
  imports: [ConversationsModule, MessagesModule],
  providers: [ChatGateway],
})
export class ChatModule {}
