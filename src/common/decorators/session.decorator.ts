import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { SESSION_DB_KEY } from '../../app.constants';

export const Session = createParamDecorator(
  (_, ctx: ExecutionContext) =>{
    const context = TelegrafExecutionContext.create(ctx).getContext();
    const session = context[SESSION_DB_KEY];
    return session;

  }
);
