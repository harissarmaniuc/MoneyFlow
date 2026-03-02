# MoneyFlow

MoneyFlow is a personal finance dashboard built with Next.js App Router, tRPC, Prisma, and NextAuth.

## Features

- Authentication (Google + credentials)
- Dashboard with bills, debts, subscriptions, reminders, birthdays
- Budget creation/editing with categories
- Expense tracking with CSV import/export
- Bill tracking with CSV import/export
- Notification center with read/unread state
- Analytics with month-over-month outflow and forecast
- Scheduled notification checks via cron endpoint

## Tech Stack

- `next` + `react`
- `@trpc/server` + `@trpc/react-query`
- `prisma` + PostgreSQL
- `next-auth` (Auth.js v5 beta)
- `tailwindcss`

## Setup

1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client and run migrations:

```bash
npx prisma migrate dev
```

4. Start the app:

```bash
npm run dev
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - lint checks
- `npm run typecheck` - TypeScript checks
- `npm run test` - run tests
- `npm run test:watch` - run tests in watch mode

## Cron Notifications

Send a `POST` request to:

`/api/cron/check-notifications`

Include header:

`Authorization: Bearer <CRON_SECRET>`

Recommended schedule: once daily.
