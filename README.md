# AgentBrowse

AgentBrowse is a Next.js application for designing and running autonomous browser workflows. It combines a React Flow workflow editor with Stagehand-powered browser actions, Browserbase cloud sessions, optional Trigger.dev background execution, Liveblocks collaboration, and a session replay viewer.

## What it does

- Create, edit, save, and delete multi-step browser workflows.

- Add configurable browser-agent nodes to a visual React Flow canvas.
- Generate a workflow from a natural-language goal with an optional AI provider.
- Run workflows in Browserbase and inspect step logs, telemetry, live sessions, and replay recordings.
- Schedule durable workflow runs through Trigger.dev when it is configured.
- Collaborate on workflow canvases with Liveblocks when its keys are configured.
- Organize workflows into workspaces and organizations with role-based membership.
- Send workflow outputs through Resend or SMTP/Nodemailer integrations.

## Application routes

| Route                                        | Purpose                                                                              |
| -------------------------------------------- | ------------------------------------------------------------------------------------ |
| `/`                                          | Landing page, sign in, sign up, integration status, and workflow preview             |
| `/workflow`                                  | Protected Workflow Studio for editing and executing workflows                        |
| `/session-replay`                            | Browserbase session replay viewer; accepts `sessionId` and `pageId` query parameters |
| `/api/trpc/[trpc]`                           | tRPC API for auth, organizations, workflows, node templates, and execution           |
| `/api/browserbase/replay/:sessionId/:pageId` | Returns a Browserbase HLS `.m3u8` replay playlist                                    |
| `/api/liveblocks-auth`                       | Authenticates Liveblocks rooms and reports configuration status                      |

The workflow studio requires the `agentbrowse_session` cookie. Unauthenticated visits to `/workflow` redirect to `/` with the sign-in flow selected.

## Tech stack

- Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS 4
- tRPC 11 with TanStack React Query
- PostgreSQL with Prisma ORM
- React Flow 12 for the workflow canvas
- Browserbase SDK and Stagehand V4 for cloud browser automation
- Trigger.dev SDK 4 for durable background runs and schedules
- Liveblocks for collaborative editing
- Zod for request and workflow validation
- Resend or Nodemailer for email nodes
- Bun for the root project package manager

## Requirements

- Bun `1.3.14` or compatible Bun release
- Node.js 22.18 or newer for the Stagehand sample in `browserbase-app/`
- PostgreSQL
- Browserbase credentials for real cloud browser execution and replay

AI, Trigger.dev, Liveblocks, and email credentials are optional for local UI development. The application exposes their integration status and uses simulation/fallback behavior in some paths when they are not configured.

## Local setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create a local environment file:

   ```bash
   copy .env.example .env
   ```

   On macOS/Linux, use `cp .env.example .env` instead.

3. Set `DATABASE_URL` to a PostgreSQL database and set `ADMIN_PASSWORD`. Add the service credentials needed for the features you want to exercise.

4. Apply the Prisma migrations and seed the admin workspace and default workflows:

   ```bash
   bunx prisma migrate dev
   bun run seed
   ```

5. Start the development server:

   ```bash
   bun run dev
   ```

Open [http://localhost:3000](http://localhost:3000). The seeded account defaults to `admin@agentbrowse.com`; its password is the value configured in `ADMIN_PASSWORD`.

## Environment variables

### Core

| Variable         | Required    | Description                                             |
| ---------------- | ----------- | ------------------------------------------------------- |
| `DATABASE_URL`   | Yes         | PostgreSQL connection string used by Prisma             |
| `ADMIN_PASSWORD` | For seeding | Password used for the seeded admin account              |
| `ADMIN_EMAIL`    | No          | Seeded admin email; defaults to `admin@agentbrowse.com` |
| `PORT`           | No          | Local server port; defaults to `3000`                   |
| `NODE_ENV`       | No          | Runtime environment                                     |

### Browser automation and execution

| Variable                           | Required              | Description                                                          |
| ---------------------------------- | --------------------- | -------------------------------------------------------------------- |
| `BROWSERBASE_API_KEY`              | For real browser runs | Browserbase API access, sessions, contexts, and replays              |
| `BROWSERBASE_PROJECT_ID`           | No                    | Browserbase project used for persistent contexts                     |
| `TRIGGER_SECRET_KEY`               | For Trigger.dev runs  | Trigger.dev API authentication                                       |
| `TRIGGER_PROJECT_ID`               | No                    | Trigger.dev project identifier used by the service                   |
| `STAGEHAND_EXTENSION_ARCHIVE_PATH` | No                    | Override the Stagehand extension archive path in worker environments |

### AI and collaboration

| Variable                            | Required          | Description                                                    |
| ----------------------------------- | ----------------- | -------------------------------------------------------------- |
| `GEMINI_API_KEY`                    | No                | Gemini-powered workflow generation and agent operations        |
| `GROK_API_KEY`                      | No                | Grok-compatible agent operations                               |
| `GROQ_MODEL`                        | No                | Optional model override used by the Grok/Groq integration path |
| `LIVEBLOCKS_SECRET_KEY`             | For collaboration | Server-side Liveblocks authentication                          |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | For collaboration | Client-side Liveblocks configuration                           |

### Email

| Variable                                | Required | Description                                                               |
| --------------------------------------- | -------- | ------------------------------------------------------------------------- |
| `RESEND_API_KEY`                        | No       | Resend provider credentials                                               |
| `RESEND_FROM_EMAIL`                     | No       | Sender used by Resend; defaults to `onboarding@resend.dev` in the example |
| `ALERT_EMAIL`                           | No       | Default destination for email workflow nodes                              |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | No       | SMTP server configuration                                                 |
| `SMTP_USER`, `SMTP_PASS`                | No       | SMTP credentials                                                          |
| `SMTP_FROM_EMAIL`                       | No       | SMTP sender address                                                       |

Do not commit `.env` files or service credentials. `.env.example` contains safe placeholders only.

## Workflow nodes

The execution registry currently supports these node archetypes:

`open_url`, `navigation`, `grounding`, `action`, `form`, `extraction`, `webhook`, `summarization`, `news_gather`, `news_summary`, `email`, and `authentication`.

Nodes are stored as JSON on each workflow together with React Flow edges. A run creates or reuses a Browserbase context, executes the graph through Stagehand, streams logs and step status to the studio, and can expose the resulting Browserbase session for replay.

## Useful commands

```bash
bun run dev       # Start Next.js development server
bun run build     # Build the production application
bun run start     # Start the production server
bun run lint      # Run ESLint
bun run seed      # Seed the admin account and default workflows
bunx prisma studio
```

For Trigger.dev development/deployment, use the Trigger.dev CLI with the project configured by `trigger.config.ts`. The workflow task entry point is `trigger/workflowExecution.ts`.

## Project structure

```text
app/                    Next.js routes, layouts, and API handlers
components/             Auth, organization, workflow, replay, and UI components
lib/                    Prisma, auth, tRPC client, and shared utilities
server/routers/         tRPC routers
server/services/        Workflow, browser, AI, email, and node execution services
prisma/                 Schema, migrations, and seed script
trigger/                Trigger.dev workflow task
browserbase-app/        Standalone Stagehand V4 Browserbase example
```

## Standalone Stagehand example

`browserbase-app/` is an independent TypeScript example that launches a Browserbase browser, attaches Stagehand, navigates to `example.com`, extracts structured data, observes a link, and clicks it.

```bash
cd browserbase-app
pnpm install
copy .env.example .env
pnpm start
```

Set `BROWSERBASE_API_KEY` in `browserbase-app/.env` before running it. This package uses `pnpm` independently of the Bun-managed root application.

## Troubleshooting

- If Prisma cannot connect, verify that PostgreSQL is running and that `DATABASE_URL` points to an accessible database.
- If the studio redirects to the landing page, sign in first or run `bun run seed` and use the seeded credentials.
- If Browserbase actions or replays are unavailable, check `BROWSERBASE_API_KEY` and, when relevant, `BROWSERBASE_PROJECT_ID`.
- If collaboration is disabled, set both Liveblocks variables and verify that `/api/liveblocks-auth` can reach Liveblocks.
- If background runs are unavailable, configure `TRIGGER_SECRET_KEY` and the Trigger.dev project settings.
  This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
