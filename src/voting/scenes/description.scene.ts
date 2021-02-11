import {
  Scene,
  SceneEnter,
  Command,
  On,
  Ctx,
  Message,
  Action,
  Sender,
} from 'nestjs-telegraf';
import {
  Session,
  SessionStore,
} from '../../common/decorators/session.decorator';
import { DESCRIPTION_SCENE_ID as DESCRIPTION_SCENE_ID } from '../../app.constants';
import { SceneContext } from 'telegraf/typings/scenes';

@Scene(DESCRIPTION_SCENE_ID)
export class DescriptionScene {
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SceneContext): Promise<void> {
    await ctx.reply('Please tell me the new description');
    //TODO set timeout if the user didn't text anything for 2 minutes, and autoexit
  }

  @On('text')
  async onDescriptionUpdated(
    @Ctx() ctx: SceneContext,
    @Session() session: SessionStore,
    @Message('text') text: string,
    @Sender('id') id: string,
  ): Promise<void> {
    const topicId = session.getUserActiveTopicId(id);
    if (!topicId) {
      await ctx.reply(`Something went wrong`);
    } else {
      const topics = session.topics;
      const topicIndex = topics.findIndex((t) => t.topicId === topicId);
      const topic = topics[topicIndex]
      topic.description = text;
      session.topics = topics;

      await ctx.reply(`${topic.name} is updated with new description: ${text}`);
    }

    await ctx.scene.leave();
  }

  @Command('exit')
  @Action('exit')
  async onLeaveCommand(@Ctx() ctx: SceneContext): Promise<void> {
    await ctx.scene.leave();
  }
}
