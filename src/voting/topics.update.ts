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
import { DESCRIPTION_SCENE_ID } from '../app.constants';
import { TopicId } from 'src/common/decorators/topicid.decorator';

@Update()
export class TopicsUpdate {
  helpMessage = `
  I can help you create and manage **topics** for chiangmaidapps meetup

  You can control me by sending these commands:
     
  /topics \\- gets a list of existing topics people have created
  /request \\[topicsName\\] \\- requests a new topic
  /description \\- add description to a selected topic
  /submit \\[topicsName\\] \\- requests a new topic and claim it to yourself
  /claim \\- claim an existing topic that you will look into
  /vote \\- vote on topic
  /schedule \\- schedule topic for date, only claimer or admin can schedule
  /help \\- returns a help message\\.
  `;
  @Start()
  async onStart(@Ctx() ctx: Context): Promise<void> {
    await ctx.replyWithMarkdownV2(this.helpMessage);
  }

  @Help()
  async help(ctx: Context): Promise<void> {
    await ctx.replyWithMarkdownV2(this.helpMessage);
  }

  @Command('topics')
  async onTopics(
    @Session() session: SessionStore,
    @Ctx() ctx: Context,
  ): Promise<void> {
    const topics = session.topics;
    if (topics.length < 1) {
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
            (claimedBy == null ? ' \\-\n' : `${claimedBy}\n`) +
            `  __Scheduled for:__        ${scheduled || ' \\-'}\n` +
            `  __Description:__` +
            (description ? `\n\n${description}\n` : '             \\-')
          );
        })
        .join('\n');
      await ctx.replyWithMarkdownV2(topicsReply);
    }
  }

  @Command('request')
  async onRequest(
    @Ctx() ctx: Context,
    @Session() session: SessionStore,
    @Message('text') text: string,
  ): Promise<void> {
    const nameOfTopics = text.slice(9);
    if (nameOfTopics.replace(' ', '') === '') {
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
      await ctx.replyWithMarkdownV2(
        `new topics ${nameOfTopics} is created with`,
      );
    }
  }

  @Command('submit')
  async submit(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: SessionStore,
    @Message('text') text: string,
  ): Promise<void> {
    const nameOfTopics = text.slice(9);
    if (nameOfTopics.replace(' ', '') === '') {
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
      await ctx.replyWithMarkdownV2(
        `new topics *${topic.name}* is created and claimed to ${from.username}`,
      );
    }
  }

  @Command('description')
  async onModifyDescription(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: SessionStore,
  ): Promise<void> {
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
    @Sender('id') id: string,
    @Session() session: SessionStore

  ): Promise<void> {
    console.log(id, topicId)
    session.setUserActiveTopic(id, topicId);
    await ctx.scene.enter(DESCRIPTION_SCENE_ID);
  }
  @Command('claim')
  onClaim(ctx: Context, @Session() session: SessionStore): void {
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
  ): void {
    const topics: Array<Topic> = session.topics;
    const topicsIndex = topics.findIndex((topic) => topic.topicId === topicId);
    if (topicsIndex < 0) {
      ctx.reply('Something went wrong. Please try again');
    } else {
      const topic = topics[topicsIndex];
      topic.claimedBy = from;
      session.topics = topics;

      ctx.reply(`${topic.name} is claimed by @${from.username}`);
    }
  }

  @Command('vote')
  onUpvote(@Ctx() ctx: Context, @Session() session: SessionStore): void {
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
    const topics: Array<Topic> = session.topics;
    const topicsIndex = topics.findIndex((topic) => topic.topicId === topicId);
    if (topicsIndex < 0) {
      ctx.reply('Something went wrong. Please try again');
    } else {
      const topic = topics[topicsIndex];
      const upvoted = topic.votes.filter((user) => user.id === from.id);

      if (upvoted.length > 0) {
        ctx.reply('Sorry you already upvoted this topic');
        return;
      } else {
        topic.votes.push(from);
      }

      session.topics = topics;

      ctx.reply(`${topic.name} is voted up by @${from.username}`);
    }
  }
}
