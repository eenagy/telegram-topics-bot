import {
  Scene,
  SceneEnter,
  Command,
  On,
  Ctx,
  Message,
  Sender,
} from 'nestjs-telegraf';
import {
  Session,
  SessionStore,
} from '../../common/decorators/session.decorator';
import {
  AUTO_TIMEOUT,
  DESCRIPTION_SCENE_ID as DESCRIPTION_SCENE_ID,
} from '../../app.constants';
import { SceneContext } from 'telegraf/typings/scenes';
import createDebug from 'debug';

const debug = createDebug('dappsbot')

@Scene(DESCRIPTION_SCENE_ID)
export class DescriptionScene {
  timeOut: NodeJS.Timeout;
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SceneContext): Promise<void> {
    debug('Description scene entered');
    await ctx.reply('Please tell me the new description');
    this.timeOut = setTimeout(() => {
      if (ctx.scene) {
        debug('Description scene autotimeout');

        ctx.reply('You took too long to reply, please retry from /changeDescription');
        ctx.scene.leave();
      }
    }, AUTO_TIMEOUT);
  }

  @On('text')
  async onDescriptionUpdated(
    @Ctx() ctx: SceneContext,
    @Session() session: SessionStore,
    @Message('text') text: string,
    @Sender('id') id: string,
  ): Promise<void> {
    debug('onDescriptionUpdated');
  
    const topicId = session.getUserActiveTopicId(id);
    if (!topicId) {
      debug('TopicId is empty');

      await ctx.reply(`Something went wrong`);
    } else {
      debug('TopicId ' + topicId);

      const topics = session.topics;
      const topicIndex = topics.findIndex((t) => t.topicId === topicId);
      const topic = topics[topicIndex];
      if (topic) {
        debug('Topic found');
        topic.description = text;
        session.topics = topics;
        debug('Topic description successfully updated');

        await ctx.reply(
          `${topic.name} is updated with new description: ${text}`,
        );
      }
    }
    clearTimeout(this.timeOut)
    await ctx.scene.leave();
  }

  @Command('exit')
  async onLeaveCommand(@Ctx() ctx: SceneContext): Promise<void> {
    debug('leave scene');
    await ctx.scene.leave();
  }
}
