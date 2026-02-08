A MUST RULES
- Keep docs brief and techinical (NO EMOJI)
- DONT create and Bash scripts or md files without certain requirement. Create files of these types only if user asked about it
- Dont write JSDoc - we dont use it.
- After changing server directory - update server/openapi.yaml to make it actual to code

# Product

DeployBot is a personal expense tracker that runs as a Telegram bot (Grammy) and an HTTP API (Fastify). Users record expenses, search transactions, and generate CSV reports (uploaded to S3). Data is stored in YDB (Yandex Database).

# Tech Stack

- Runtime: Node 22 (ESM)
- Language: TypeScript 5.9, strict mode
- Build: Vite (library mode, single ES bundle -> dist/index.js)
- HTTP: Fastify 4 with @fastify/cors
- Bot: Grammy 1.21 (Telegram Bot API)
- Database: YDB via @ydbjs/* packages (v6)
- Testing: Vitest 4 (globals enabled, node environment)
- Linting: ESLint with @typescript-eslint
- Deployment: Docker (node:24-alpine, multi-stage), systemd service

# Development

Use mv to move files, not read/write operations.
We use YDB as primary database in our project. You can find documentation about YDB at https://ydb.tech/docs

# Architecture

```
src/
  index.ts              -- entrypoint: boots bot + server, handles graceful shutdown
  config/               -- env var loading and validation (Environment interface)
  logger/               -- simple console wrapper (log, info, error, warn, debug)
  typings/              -- shared TypeScript interfaces
  bot/                  -- Telegram bot (Grammy)
  server/               -- HTTP API (Fastify)
  core/                 -- business logic layer
  db/                   -- data access layer
  lib/                  -- shared utilities
```

## Data Flow

1. Request arrives via Telegram message or HTTP GET
2. Server route / bot handler calls a core function (createExpense, findTransactions, getReport)
3. Core validates input, builds query via db/yql builders
4. db/index.ts withConnection opens a YDB Driver, executes the query, closes driver
5. Raw YDB results (ITransactionYDB with Buffer/BigInt) are mapped to ITransaction via readTransactionsFromYDB
6. Result returned to caller. For reports: transactions -> CSV -> S3 upload -> URL returned

## Database

YQL queries are stored as `.yql` template files in `src/db/yql/queries/` and loaded at build time via Vite's `import.meta.glob` with `?raw`. Placeholders use `${name}` syntax and are resolved positionally at runtime by `parseQuery`.

## Key Patterns

- Connection-per-request: each DB operation creates and closes its own YDB Driver via withConnection
- Query templates: .yql files with ${placeholder} interpolation, loaded eagerly at startup
- Table name branching: production uses `transactions`, development uses `transactions_dev`
- Bot is optional in dev: if BOT_TOKEN is missing and NODE_ENV=development, bot is null and server starts without it

# Testing

We use Vitest for testing in our project. All tests have to be stored in separate `tests` folder near code which you need to test. For example you can check `src/lib/date`.

Test config is in vite.config.ts: globals enabled, node environment, 30s timeout.
Test mocks for DB layer are in `src/db/tests/mocks/`.

# Commands

| Command | Description |
|---------|-------------|
| npm run dev | Build dev + run |
| npm run build | Production build |
| npm run start | Run built dist/index.js |
| npm run test | Vitest run |
| npm run test:watch | Vitest watch mode |
| npm run test:coverage | Vitest with V8 coverage |
| npm run typechecking | tsc --noEmit |
| npm run lint | ESLint check |
| npm run lint:fix | ESLint auto-fix |
| make docker-deploy | Pull + start production containers |
| make docker-deploy-dev | Build + start dev containers |
