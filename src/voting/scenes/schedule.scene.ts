import {
  Scene,
  SceneEnter,
  Command,
  Ctx,
  Action,
  Sender,
} from 'nestjs-telegraf';
import {
  Session,
  SessionStore,
} from '../../common/decorators/session.decorator';
import { AUTO_TIMEOUT, SCHEDULE_SCENE_ID } from '../../app.constants';
import { SceneContext } from 'telegraf/typings/scenes';
import createDebug from 'debug';
import Calendar from './calendar';

const debug = createDebug('dappsbot');
const calendar = new Calendar();

@Scene(SCHEDULE_SCENE_ID)
export class ScheduleScene {
  timeOut: NodeJS.Timeout;
  @SceneEnter()
  async onSceneEnter(@Ctx() ctx: SceneContext): Promise<void> {
    debug('Schedule scene entered');
    await ctx.reply('Select a date from the calendar', calendar.renderToday());
    this.timeOut = setTimeout(() => {
      if (ctx.scene) {
        ctx.reply('You took too long to reply, please retry from /description');
        ctx.scene.leave();
      }
    }, AUTO_TIMEOUT);
  }

  @Action(new RegExp(/calendar-telegram-date-[\d-]+/g))
  async onDateSelected(
    @Session() session: SessionStore,
    @Sender('id') id: string,
    @Ctx() ctx: SceneContext,
  ): Promise<void> {
    debug('onDateUpdated');
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
        topic.scheduled = new Date().toDateString();
        session.topics = topics;
        debug('Topic description successfully updated');

        await ctx.reply(`${topic.name} is scheduled at: ${new Date()}`);
      }
    }
    clearTimeout(this.timeOut);
    await ctx.scene.leave();
  }

  @Action(new RegExp(/calendar-telegram-prev-[\d-]+/g))
  async onCalendarPrev(@Ctx() ctx: SceneContext): Promise<void> {
    debug('onDateUpdated');
    await ctx.editMessageReplyMarkup(calendar.renderToday())

  }

  @Action(new RegExp(/calendar-telegram-next-[\d-]+/g))
  async onCalendarNext(@Ctx() ctx: SceneContext): Promise<void> {
    debug('onDateUpdated');
    await ctx.editMessageReplyMarkup(calendar.renderToday())
  }

  @Action(new RegExp(/calendar-telegram-ignore-[\d\w-]+/g))
   ignoreAction(): void {
    debug('ignore calendar option');
  }

  @Command('exit')
  async onLeaveCommand(@Ctx() ctx: SceneContext): Promise<void> {
    debug('leave scene');
    await ctx.scene.leave();
  }
}
