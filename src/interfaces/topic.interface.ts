import {
    User,
  } from 'telegraf/typings/telegram-types';
export interface Topic {
  name: string;
  description: string;
  votes: User[];
  claimedBy: User;
  scheduled: number;
  topicId: string;
}
