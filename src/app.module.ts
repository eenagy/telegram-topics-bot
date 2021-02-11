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
        // launchOptions: {
        //   webhook: {
        //     /** Webhook url path; will be automatically generated if not specified */
        //     hookpath: null,
        //     /** Public domain for webhook. If domain is not specified, hookPath should contain a domain name as well (not only path component). */
        //     domain: null,
        //     host: null,
        //     port: null,
        //     /** TLS server options. Omit to use http. */
        //     tlsOptions: null,

        //     cb: null,
        //   },
        // },
        middlewares: [sessionMiddleware],
      }),
    }),
    TopicsModule,
  ],
})
export class AppModule {}
