import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { sessionMiddleware } from './middleware/session.middleware';
import { TopicsModule } from './voting/topics.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
  
    TelegrafModule.forRootAsync({
      imports: [ConfigModule, TopicsModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get('DAPPS_BOT_TOKEN'),
        middlewares: [sessionMiddleware],
      }),
    }),
    TopicsModule
  ],
})
export class AppModule {}
