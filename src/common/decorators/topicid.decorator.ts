import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';


export const TopicId = createParamDecorator(
  (_, ctx: ExecutionContext) =>{
    const context = TelegrafExecutionContext.create(ctx).getContext();
    const topicId = context.callbackQuery.data.split('---')[1];
    return topicId;

  }, 
);
