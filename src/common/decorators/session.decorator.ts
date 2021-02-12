import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TelegrafExecutionContext } from 'nestjs-telegraf';
import { Topic } from '../../interfaces/topic.interface';
import { SESSION_DB_KEY } from '../../app.constants';
import { User } from 'telegraf/typings/telegram-types';

export class SessionStore {
  private session;
  constructor(context: ExecutionContext) {
    this.session = context[SESSION_DB_KEY];
  }

  public get activeTopics(): Topic[] {
    return this.session.get('activeTopics').value();
  }
  public get topics(): Topic[] {
    return this.session.get('topics').value();
  }
  public set topics(newTopics: Topic[]) {
    this.session.set('topics', newTopics);
  }

  public getUserActiveTopicId(userId: number): string | undefined {
    const activeTopics = this.session.get('activeTopics').value();
    const activeTopicIndex = activeTopics.findIndex(
      (active) => active.userId === userId,
    );
    if (activeTopicIndex < 0) {
      return null;
    } else {
      return activeTopics[activeTopicIndex].topicId;
    }
  }
  public setUserActiveTopicId(userId: number, topicId: string): void {
    const activeTopics = this.session.get('activeTopics').value();
    const activeTopicIndex = activeTopics.findIndex(
      (active) => active.userId === userId,
    );
    if (activeTopicIndex < 0) {
      activeTopics.push({
        userId,
        topicId,
      });
    } else {
      const activeTopic = activeTopics[activeTopicIndex];
      activeTopic.topicId = topicId;
    }
    this.session.set('topics', activeTopics);
  }
}

export const Session = createParamDecorator((_, ctx: ExecutionContext) => {
  const context = TelegrafExecutionContext.create(ctx).getContext();
  const session = new SessionStore(context);
  return session;
});
