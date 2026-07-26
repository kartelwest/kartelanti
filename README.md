# Northstar AI

A local-first iPhone productivity app: intelligent calendar organizer, task planner, focus assistant, and adaptive daily scheduler.

> Repo name: `kartelAnti`

## What it is

Northstar AI builds a realistic day from fixed calendar commitments, deadlines, energy levels, context-switching cost, and your personal work rules. It prioritizes realism over a perfectly packed calendar.

## Current feature list

- Onboarding for work hours, energy profile, buffers, and focus defaults
- Today dashboard with confidence, next item, top priorities, and timeline
- Inbox with natural-language capture and confirmation flow
- Task management with priority, energy, context, deadlines, and recurrence
- Planner with day/week navigation and block explanations
- Focus mode with timer, pause/resume, complete, and stop
- Settings with sample data, reset, and privacy explanation
- Local-first SQLite storage (with web fallback via `expo-sqlite` web worker)
- Deterministic scheduling engine with energy-aware scoring
- Natural-language parser with local, remote, and mock adapters
- Calendar and AI provider interfaces for future integrations

## Architecture

- **Expo SDK 57** with Expo Router v4 (file-based routes)
- **React 19 / React Native 0.86**
- **TypeScript** strict mode
- **expo-sqlite** for durable local data
- **TanStack Query** for async data fetching
- **Zustand** (ready to use) for transient UI state
- **React Hook Form + Zod** (ready to use) for forms
- Domain logic lives under `src/`; routes live under `app/`

## Directory structure

```
app/                 # Expo Router screens
  (tabs)/            # Bottom tabs: today, plan, inbox, focus, settings
  onboarding.tsx
  task/new.tsx
  +not-found.tsx
components/ui/         # Design system: Button, Card, Input, Pill, Text
src/
  types/             # Domain models
  theme/             # Color, spacing, typography tokens and ThemeProvider
  utils/             # Date helpers and id generator
  database/          # Schema, migrations, repositories
  services/          # Scheduler, parser, AI, calendar, notifications
  state/             # TanStack Query hooks
  features/          # Reserved for feature modules
```

## Installation

```bash
cd kartelAnti
npm install
```

Requires Node.js 22 LTS (or compatible with Expo SDK 57).

## Running in Expo Go

```bash
npx expo start
```

Then scan the QR code with Expo Go on iOS.

## Expo Go limitations

- SQLite runs in memory in Expo Go; a development build is recommended for persistent device storage.
- Calendar device integration requires an Expo development build.
- Notifications require a physical device or development build.

## Creating an Expo development build

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --profile development --platform ios
npx expo start --dev-client
```

## Testing Apple Calendar integration

Full device-calendar testing requires a development build. The app falls back to `LocalCalendarProvider` in preview and web. Enable the device calendar in settings once a development build is installed.

## Running tests

```bash
npm test
```

## Running type checking

```bash
npm run typecheck
```

## Running lint

```bash
npm run lint
```

## Running Expo Doctor

```bash
npm run doctor
```

## Database migration strategy

Migrations run automatically on app launch. `src/database/migrations.ts` applies the schema in order. Use `resetDatabase()` from settings to wipe and re-apply migrations.

## Local-first privacy model

All data stays on the device. No analytics, ads, tracking, or remote AI calls are made by default. `.env*` files are excluded from Git.

## Optional future Supabase integration

A future backend can be added as a secure provider behind the repository layer. Server-side logic should receive only the data it needs.

## Optional future OpenAI integration

A `RemotePlanningAIProvider` is stubbed. It must call a server-side function (e.g., Supabase Edge Function) and never include an OpenAI key in the mobile client or `.env`.

## Security warning about client-side API keys

Do not place OpenAI, Supabase service-role, or other privileged keys in `EXPO_PUBLIC_*`, `.env`, `SecureStore`, or source code. Future AI integrations must route through a secure server endpoint.

## Web / Vercel

The app can be exported for web:

```bash
npm run build:web
```

The output is in `dist/`. `vercel.json` is configured to serve the static export. Vercel deployment requires linking the project (see `docs/DEVELOPMENT-BUILD.md`).

## Known limitations

- Scheduling drag-and-drop is not implemented; editing uses task sheets.
- Insights screen is planned but not yet built.
- Advanced recurrence expansion is not yet implemented.
- Natural-language parser uses local rules; remote adapter is stubbed.

## Roadmap

- Insights screen with local-only metrics
- Drag-and-drop planner
- Apple Calendar device integration in development build
- Recurrence expansion
- Remote AI provider endpoint
- iOS native focus notifications
