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
    NAME_SCENE_ID,
  } from '../../app.constants';
  import { SceneContext } from 'telegraf/typings/scenes';
  import createDebug from 'debug';
  
  const debug = createDebug('dappsbot')
  
  @Scene(NAME_SCENE_ID)
  export class NameScene {
    timeOut: NodeJS.Timeout;
    @SceneEnter()
    async onSceneEnter(@Ctx() ctx: SceneContext): Promise<void> {
      debug('Name scene entered');
      await ctx.reply('Please tell me the new name');
      this.timeOut = setTimeout(() => {
        if (ctx.scene) {
          debug('Name scene autotimeout');
          ctx.reply('You took too long to reply, please retry from /changeName');
          ctx.scene.leave();
        }
      }, AUTO_TIMEOUT);
    }
  
    @On('text')
    async onNameUpdated(
      @Ctx() ctx: SceneContext,
      @Session() session: SessionStore,
      @Message('text') text: string,
      @Sender('id') id: string,
    ): Promise<void> {
      debug('onNameUpdated');
    
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
          const oldName = topic.name;
          topic.name = text;
          session.topics = topics;
          debug('Topic name successfully updated');
  
          await ctx.reply(
            `${oldName} is updated with new name: ${text}`,
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
  