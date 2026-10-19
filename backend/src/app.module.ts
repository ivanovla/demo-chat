import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { loadConfig } from './config/config';
import { ConversationsModule } from './conversations/conversations.module';
import { MessagesModule } from './messages/messages.module';
import { RealtimeModule } from './realtime/realtime.module';
import { StoriesModule } from './stories/stories.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    MongooseModule.forRootAsync({ useFactory: () => ({ uri: loadConfig().mongoUri }) }),
    ScheduleModule.forRoot(),
    RealtimeModule,
    UsersModule,
    AuthModule,
    ConversationsModule,
    MessagesModule,
    ChatModule,
    StoriesModule,
  ],
})
export class AppModule {}
