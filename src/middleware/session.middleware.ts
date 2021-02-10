import { SESSION_KEY, SESSION_FILE_STORAGE } from '../app.constants';
import * as LocalSession from 'telegraf-session-local';

const property = 'session';
// @ts-ignore
const localSession = new LocalSession({
  // Database name/path, where sessions will be located (default: 'sessions.json')
  database: SESSION_FILE_STORAGE,
  // Name of session property object in Telegraf Context (default: 'session')
  property: SESSION_KEY,
  // Format of storage/database (default: JSON.stringify / JSON.parse)
  format: {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    serialize: (obj: any): string => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
    deserialize: (str: string): any => JSON.parse(str),
  },
  state: {
    topics: [
      {
        name: 'Funky talk',
        description: "Earum veniam necessitatibus cumque\\. Tempora deleniti dolor animi odit molestias illo\\. Necessitatibus incidunt vel magni\\. Perferendis delectus sit et\\.\\\nIpsum recusandae et sapiente velit\\. Ratione ipsa at eum odio ratione\\. Tenetur quam voluptatem expedita odio\\. Odit aliquid asperiores suscipit\\. Rerum omnis non velit debitis doloremque\\.\\\nCorporis voluptatum occaecati sapiente accusantium natus non ab\\. A non magnam sed\\. Blanditiis et fuga occaecati repudiandae dolorum esse et\\. Cum et ad expedita repellat ipsam omnis suscipit\\.",
        votes: [],
        claimedBy: null,
        scheduled: null,
        topicId: 'abcde1'
      },
      {
        name: 'Another talk',
        description: "",
        votes: [],
        claimedBy: null,
        scheduled: null,
        topicId: 'abcde2'

      },
    ],
  },
});
export const sessionMiddleware = localSession.middleware(property);
