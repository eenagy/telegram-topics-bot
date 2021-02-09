import {
  Start,
  Update,
  Ctx,
  Command,
  Help,
  Action,
} from 'nestjs-telegraf';
import { SESSION_DB_KEY } from '../app.constants';
import { Markup, Context } from 'telegraf';
import { SceneContext } from 'telegraf/typings/scenes';
import {
  CallbackQuery,
  Message as MessageNamespace,
} from 'telegraf/typings/telegram-types';

@Update()
export class VotingUpdate {
  helpMessage = `
  I can help you create and manage **topics** for chiangmaidapps meetup

  You can control me by sending these commands:
     
  /topics \\- gets a list of existing topics people have created
  /pasttopics \\- gets a list of all past topics, feel free to browse past topics and request it again
  /request \\[topicsName\\] \\- requests a new topic for someone else to claim
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
  async onTopics(ctx: Context): Promise<void> {
    const topicsReply = ctx[SESSION_DB_KEY].get('topics')
      .map(({ name, description, votes, claimedBy, scheduled }) => {
        return (
          `\\- *${name}*\n` +
          `  __Number of votes:__  ${votes.length}\n` +
          `  __Presented by:__         ` +
          (claimedBy == null ? ' \\-\n' : `${claimedBy}\n`) +
          `  __Scheduled for:__        ${scheduled || ' \\-'}\n` +
          `  __Description:__`+ (description ?`\n\n${description}\n`: '             \\-')
        );
      })
      .join('\n');
    await ctx.replyWithMarkdownV2(topicsReply);
  }

  @Command('request')
  async onRequest(@Ctx() ctx: SceneContext): Promise<void> {
    const nameOfTopics = (ctx.message as MessageNamespace.TextMessage).text.slice(
      9,
    );
    const topics = ctx[SESSION_DB_KEY].get('topics').value();
    topics.push({
      name: nameOfTopics,
      description: null,
      votes: [],
      claimedBy: null,
      scheduled: null,
    });
    ctx['sessionDB'].set('topics', topics);
    await ctx.reply(`request is added to the topics ${nameOfTopics}`);
  }

  @Command('claim')
  onClaim(ctx: Context): void {
    const topicsButton = ctx[SESSION_DB_KEY].get('topics')
      .value()
      .map(({ name }) => Markup.button.callback(name, `claim---${name}`));
    ctx.reply('Claim', Markup.inlineKeyboard(topicsButton));
  }

  @Action(new RegExp('claim---[a-zA-Z]*'))
  onAction(@Ctx() ctx: Context): void {
    // @ts-ignore
    const from = ctx.update.callback_query.from;
    const name = (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data.split(
      '---',
    )[1];
    const topics = ctx[SESSION_DB_KEY].get('topics')
      .value()
      .map((values) => {
        if (values.name === name) {
          return {
            ...values,
            claimedBy: from,
          };
        }
        return values;
      });
    ctx['sessionDB'].set('topics', topics);

    ctx.reply(`${name} is claimed by ${from.first_name}`);
  }


  @Command('poll')
  onUpvote(ctx: Context): void {
    const topics = ctx[SESSION_DB_KEY].get('topics').map(({ name }) => name);
    ctx.replyWithPoll(
      'Please select topics which you would like to vote for',
      topics,
      { is_anonymous: false, allows_multiple_answers: true },
    );
  }

  @Command('settings')
  onSettings(ctx: Context): void {
    ctx.reply('settings');
  }
}
