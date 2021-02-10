import {
  Start,
  Update,
  Ctx,
  Command,
  Help,
  Action,
  Sender,
} from 'nestjs-telegraf';
import { Markup, Context } from 'telegraf';
import {
  CallbackQuery,
  Message as MessageNamespace,
  User,
} from 'telegraf/typings/telegram-types';
import { nanoid } from 'nanoid';
import { Session } from '../common/decorators/session.decorator';
import { Topic } from '../interfaces/topic.interface';
import { LocalSession } from '../interfaces/session.interface';

@Update()
export class VotingUpdate {
  helpMessage = `
  I can help you create and manage **topics** for chiangmaidapps meetup

  You can control me by sending these commands:
     
  /topics \\- gets a list of existing topics people have created
  /request \\[topicsName\\] \\- requests a new topic for someone else to claim
  /submit \\[topicsName\\] \\- requests a new topic and claim topics
  /claim \\- claim an existing topic that you will look into
  /poll \\- open poll for voting
  /schedule \\- schedule topic for date, only claimer or admin can schedule
  /settings \\- \\(if applicable\\) returns the bot's settings for this user and suggests commands to edit these settings
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
  async onTopics(@Session() session: LocalSession, @Ctx() ctx: Context): Promise<void> {
    console.log(session
      .get('topics'))
    const topicsReply = session
      .get('topics')
      .value()
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

  @Command('request')
  async onRequest(@Ctx() ctx: Context, @Session() session: LocalSession): Promise<void> {
    const nameOfTopics = (ctx.message as MessageNamespace.TextMessage).text.slice(
      9,
    );
    const topics: Array<Topic> = session.get('topics').value();
    const topic = {
      name: nameOfTopics,
      description: null,
      votes: [],
      claimedBy: null,
      scheduled: null,
      topicId: nanoid(6),
    };
    topics.push(topic);
    session.set('topics', topics);
    await ctx.replyWithMarkdownV2(
      `new topics ${nameOfTopics} is created with topicId: __${topic.topicId}__`,
    );
  }

  @Command('submit')
  async submit(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: LocalSession,
  ): Promise<void> {
    const nameOfTopics = (ctx.message as MessageNamespace.TextMessage).text.slice(
      9,
    );
    const topics: Array<Topic> = session.get('topics').value();
    const topic = {
      name: nameOfTopics,
      description: null,
      votes: [],
      claimedBy: from,
      scheduled: null,
      topicId: nanoid(6),
    };
    topics.push(topic);
    session.set('topics', topics);
    await ctx.replyWithMarkdownV2(
      `new topics *${nameOfTopics}* is created with topicId: *${topic.topicId}* and claimed to ${from.username}`,
    );
  }


  // @Action('modifyDescription')
  // onModifyDescription(
  //   @Ctx() ctx: Context,
  //   @Sender() from: User,
  //   @Session() session: LocalSession,
  // ): void {
  //   const topics: Array<Topic> = session.get('topics').value();
  //   const lastTopics = topics[topics.length - 1];
  //   topics[topics.length - 1] = {
  //     ...lastTopics,
  //     claimedBy: from,
  //   };
  //   session.set('topics', topics);
  //   ctx.reply;
  //   ctx.reply(`${lastTopics.name} is claimed by ${from.first_name}`);
  // }

  @Command('claim')
  onClaim(ctx: Context, @Session() session: LocalSession): void {
    const topics: Array<Topic> = session.get('topics').value();
    const topicsButton = topics.map(({ name, topicId }) =>
      Markup.button.callback(name, `claim---${topicId}`),
    );
    ctx.reply('Claim', Markup.inlineKeyboard(topicsButton));
  }

  @Action(new RegExp('claim---[a-zA-Z0-9]*'))
  onAction(
    @Ctx() ctx: Context,
    @Sender() from: User,
    @Session() session: LocalSession,
  ): void {
    const topicId = (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data.split(
      '---',
    )[1];
    let topics: Array<Topic> = session.get('topics').value();
    topics = topics.map((values) => {
      if (values.topicId === topicId) {
        return {
          ...values,
          claimedBy: from,
        };
      }
      return values;
    });
    session.set('topics', topics);

    ctx.reply(`${name} is claimed by ${from.first_name}`);
  }

  @Command('vote')
  onUpvote(ctx: Context, @Session() session: LocalSession): void {
    const topics: Array<Topic> = session.get('topics').value();

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
    @Session() session: LocalSession,
  ): void {
    const topicId = (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data.split(
      '---',
    )[1];
    let topics: Array<Topic> = session.get('topics').value();

    topics = topics.map((topic: Topic) => {
      if (topic.topicId === topicId) {
        const upvoted = topic.votes.filter((user) => user.id === from.id);
        if (upvoted.length > 0) {
          ctx.reply('Sorry you already upvoted this topic');
          return;
        } else {
          topic.votes.push(from);
        }
        return topic;
      }
      return topic;
    });
    session.set('topics', topics);

    ctx.reply(`${name} is voted up by ${from.first_name}`);
  }

  @Command('settings')
  onSettings(ctx: Context): void {
    ctx.reply('settings');
  }
}
