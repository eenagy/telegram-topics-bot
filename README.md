# Telegram bot for opengovernance voting for events

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
# Remove local-session typing
$ rm node_modules/telegraf-session-local/lib/session.d.ts
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Telegram bot setup

Please follow the instructions at [Telegram bot api](https://core.telegram.org/bots#3-how-do-i-create-a-bot) to setup your own telegram bot.
After you obtained a BOT API key, please create an `.env` file based on `.env.example` and replace the `DAPPS_BOT_TOKEN` with your obtained key.

No you can start your application either locally or deploy it to your own choosing.

## Session FAQ

   - State sync up
   - Changing sessions to other supported ones

## Supported commands

   - /help
   - /topics
   - /request
   - /submit
   - /description
   - /claim
   - /schedule
   - /vote
  



