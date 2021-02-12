import {
  Start,
  Update,
  Ctx,
  Command,
  Help,
  Action,
  Sender,
  Message,
} from 'nestjs-telegraf';
import { Markup, Context } from 'telegraf';
import { User } from 'telegraf/typings/telegram-types';
import { nanoid } from 'nanoid';
import { Session, SessionStore } from '../common/decorators/session.decorator';
import { Topic } from '../interfaces/topic.interface';
import { SceneContext } from 'telegraf/typings/scenes';
import {
  DESCRIPTION_SCENE_ID,
  NAME_SCENE_ID,
  SCHEDULE_SCENE_ID,
} from '../app.constants';
import { TopicId } from '../common/decorators/topicid.decorator';
import createDebug from 'debug';

const debug = createDebug('dappsbot');

@Update()
export class TopicsUpdate {
  helpMessage = `
  I can help you create and manage **topics** for chiangmaidapps meetup

  You can control me by sending these commands:
     
  /topics \\- gets a list of existing topics people have created
  /request \\[topicsName\\] \\- requests a new topic
  /changeDescription \\- change description of  a selected topic
  /changeName \\- change name of a selected topic
  /submit \\[topicsName\\] \\- requests a new topic and claim it to yourself
  /claim \\- claim an existing topic that you will look into, it toggles when calling twice
  /vote \\- vote on topic
  /schedule \\- schedule topic for date, only claimer/admins can schedule
  /help \\- returns a help message\\.
  `;
  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    debug('App started');
    await ctx.replyWithMarkdownV2(this.helpMessage);
  }

  @Help()
  async help(ctx: Context): Promise<void> {
    debug('Help requested');
    await ctx.replyWithMarkdownV2(this.helpMessage);
  }

  @Command('topics')
  async onTopics(
    @Session() session: SessionStore,
    @Ctx() ctx: Context,
  ): Promise<void> {
    debug('OnTopics');
    const topics = session.topics;
    if (topics.length < 1) {
      debug('No topics found.');

      await ctx.reply(
        'There is no topic as so far. Be the first one to add a new one',
      );
    } else {
      const topicsReply = topics
        .map(({ name, description, votes, claimedBy, scheduled }: Topic) => {
          return (
            `\\- *${name}*\n` +
            `  __Number of votes:__  ${votes.length}\n` +
            `  __Presented by:__         ` +
            (claimedBy == null ? ' \\-\n' : `@${claimedBy.username}\n`) +
            `  __Scheduled for:__        ${
              scheduled?.replace(/-/g, '\\-') || ' \\-'
            }\n` +
            `  __Description:__` +
            (description ? `\n\n${description}\n` : '             \\-')
          );
        })
        .join('\n');
      debug('Following topics returned ' + topicsReply);
      await ctx.replyWithMarkdownV2(topicsReply);
    }
  }

  @Command('request')
  async onRequest(
    @Ctx() ctx: Context,
    @Session() session: SessionStore,
    @Message('text') text: string,
  ): Promise<void> {
    debug('onRequest');
    const nameOfTopics = text.slice(9);
    if (nameOfTopics.replace(' ', '') === '') {
      debug("no topic's name passed into.");
      await ctx.reply('Please pass a name for creating a topic');
    } else {
      const topics: Array<Topic> = session.topics;
      const topic = {
        name: nameOfTopics,
        description: null,
        votes: [],
        claimedBy: null,
        scheduled: null,
        topicId: nanoid(6),
      };
      topics.push(topic);
      session.topics = topics;
      debug('New topic added');
      await ctx.replyWithMarkdownV2(
        `new topic with name ${nameOfTopics} is created`,
      );
    }
  }

  @Command('submit')
  async onSubmit(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: SessionStore,
    @Message('text') text: string,
  ): Promise<void> {
    debug('onSubmit');
    const nameOfTopics = text.slice(8);
    if (nameOfTopics.replace(' ', '') === '') {
      debug('no name passed for creating topic');
      await ctx.reply('Please pass a name for creating a topic');
    } else {
      const topics: Array<Topic> = session.topics;
      const topic = {
        name: nameOfTopics,
        description: null,
        votes: [],
        claimedBy: from,
        scheduled: null,
        topicId: nanoid(6),
      };
      topics.push(topic);
      session.topics = topics;
      debug('New topic added');
      await ctx.replyWithMarkdownV2(
        `new topics *${topic.name}* is created and claimed to ${from.username}`,
      );
    }
  }

  @Command('changeDescription')
  async onModifyDescription(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: SessionStore,
  ): Promise<void> {
    debug('onModifyDescription');
    const topics: Array<Topic> = session.topics;
    const topicsButton = topics.map(({ name, topicId }) =>
      Markup.button.callback(name, `description---${topicId}`),
    );
    ctx.reply(
      'Add description to one of the topics. Click on the button',
      Markup.inlineKeyboard(topicsButton),
    );
  }
  @Action(new RegExp('description---[a-zA-Z0-9]*'))
  async onDescription(
    @Ctx() ctx: SceneContext,
    @TopicId() topicId: string,
    @Sender('id') id: number,
    @Session() session: SessionStore,
  ): Promise<void> {
    const topic: Topic = session.topics[topicId];
    if (topic.claimedBy && topic.claimedBy.id !== id) {
      debug('Cannot change description of claimed topic');
      await ctx.reply(
        'Sorry you cannot change description of topic claimed by someone else',
      );
    } else {
      session.setUserActiveTopicId(id, topicId);
      debug(`activeTopic set userId: ${id} topicId: ${topicId}`);
      await ctx.scene.enter(DESCRIPTION_SCENE_ID);
    }
  }

  @Command('changeName')
  async onChangeName(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: SessionStore,
  ): Promise<void> {
    debug('onChangeName');
    const topics: Array<Topic> = session.topics;
    const topicsButton = topics.map(({ name, topicId }) =>
      Markup.button.callback(name, `changeName---${topicId}`),
    );
    ctx.reply(
      'Change name by selecting a topic bellow',
      Markup.inlineKeyboard(topicsButton),
    );
  }
  @Action(new RegExp('changeName---[a-zA-Z0-9]*'))
  async onChangeNameAction(
    @Ctx() ctx: SceneContext,
    @TopicId() topicId: string,
    @Sender('id') id: number,
    @Session() session: SessionStore,
  ): Promise<void> {
    const topic: Topic = session.topics[topicId];
    if (topic.claimedBy && topic.claimedBy.id !== id) {
      debug('Cannot change name of claimed topic');
      await ctx.reply(
        'Sorry you cannot change name of topic claimed by someone else',
      );
    } else {
      session.setUserActiveTopicId(id, topicId);
      debug(`activeTopic set userId: ${id} topicId: ${topicId}`);
      await ctx.scene.enter(NAME_SCENE_ID);
    }
  }

  @Command('schedule')
  async onSchedule(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: SessionStore,
  ): Promise<void> {
    debug('onSchedule');
    const topics: Array<Topic> = session.topics;
    const topicsButton = topics.map(({ name, topicId }) =>
      Markup.button.callback(name, `schedule---${topicId}`),
    );
    ctx.reply(
      'Select a topic which you would like to add a date for',
      Markup.inlineKeyboard(topicsButton),
    );
  }

  @Action(new RegExp('schedule---[a-zA-Z0-9]*'))
  async onScheduleAction(
    @Ctx() ctx: SceneContext,
    @TopicId() topicId: string,
    @Sender('id') id: number,
    @Session() session: SessionStore,
  ): Promise<void> {
    const topic: Topic = session.topics[topicId];
    if (topic.claimedBy && topic.claimedBy.id !== id) {
      debug('Cannot schedule claimed topic');
      await ctx.reply(
        'Sorry you cannot schedule topic claimed by someone else',
      );
    } else {
      session.setUserActiveTopicId(id, topicId);
      debug(`activeTopic set userId: ${id} topicId: ${topicId}`);
      await ctx.scene.enter(SCHEDULE_SCENE_ID);
    }
  }

  @Command('claim')
  onClaim(ctx: Context, @Session() session: SessionStore): void {
    debug('onClaim');
    const topics: Array<Topic> = session.topics;
    const topicsButton = topics.map(({ name, topicId }) =>
      Markup.button.callback(name, `claim---${topicId}`),
    );
    ctx.reply('Claim', Markup.inlineKeyboard(topicsButton));
  }

  @Action(new RegExp('claim---[a-zA-Z0-9]*'))
  onAction(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: SessionStore,
    @TopicId() topicId: string,
    @Sender('id')
    id: number,
  ): void {
    debug('onClaimAction');
    const topic: Topic = session.topics[topicId];
    if (topic.claimedBy && topic.claimedBy.id !== id) {
      debug('cannot claim someone else topic');
      ctx.reply(
        'Cannot claim someone topics. Please ask the the person to remove the claim or create a similar topic.',
      );
    } else {
      const topics: Array<Topic> = session.topics;
      const topicsIndex = topics.findIndex(
        (topic) => topic.topicId === topicId,
      );
      if (topicsIndex < 0) {
        debug('Could not find topicId');
        ctx.reply('Something went wrong. Please try again');
      } else {
        const topic = topics[topicsIndex];
        if (topic.claimedBy) {
          topic.claimedBy = null;
          session.topics = topics;
          debug('Topic unclaimed');
          ctx.reply(`${topic.name} claim is removed`);
        } else {
          topic.claimedBy = from;
          session.topics = topics;
          debug('Topic claimed');
          ctx.reply(`${topic.name} is claimed by @${from.username}`);
        }
      }
    }
  }

  @Command('vote')
  onUpvote(@Ctx() ctx: Context, @Session() session: SessionStore): void {
    debug('onVote');
    const topics: Array<Topic> = session.topics;

    const topicsButton = topics.map(({ topicId, name }) =>
      Markup.button.callback(name, `upvote---${topicId}`),
    );
    ctx.reply(
      'Please select topics which you would like to vote for',
      Markup.inlineKeyboard(topicsButton),
    );
  }

  @Action(new RegExp('upvote---[a-zA-Z0-9]*'))
  upvote(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: SessionStore,
    @TopicId() topicId: string,
  ): void {
    debug('action onUpvote');

    const topics: Array<Topic> = session.topics;
    const topicsIndex = topics.findIndex((topic) => topic.topicId === topicId);
    if (topicsIndex < 0) {
      debug('topicId is empty');

      ctx.reply('Something went wrong. Please try again');
    } else {
      const topic = topics[topicsIndex];
      const upvoted = topic.votes.filter((user) => user.id === from.id);

      if (upvoted.length > 0) {
        debug('Topic is already upvoted');
        ctx.reply('Sorry you already upvoted this topic');
      } else {
        topic.votes.push(from);

        session.topics = topics;
        debug('Topic is upvoted');
        ctx.reply(`${topic.name} is voted up by @${from.username}`);
      }
    }
  }
}
