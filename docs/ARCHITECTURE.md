# Architecture

## Principles

1. **Local-first**: All personal data lives in SQLite on the device.
2. **Domain-driven**: Scheduling, parsing, and AI logic are pure TypeScript modules.
3. **UI decoupled**: Screens use TanStack Query hooks; repositories own SQL.
4. **Provider interfaces**: Calendar, AI, and notifications are behind interfaces for future swap.

## Layers

- `app/`: Expo Router screens and layouts.
- `components/ui/`: Reusable design-system components.
- `src/types`: Shared domain types.
- `src/database`: Schema, migrations, connection, repositories.
- `src/services`: Scheduler engine, parser, AI stubs, calendar stubs, notifications.
- `src/state`: TanStack Query hooks.
- `src/theme`: Tokens and ThemeProvider.
- `src/utils`: Date helpers and id generator.

## Data flow

1. Screens call `useTasks`, `useSchedule`, `useInbox`, `usePreferences`, etc.
2. Hooks invoke repositories, which use `expo-sqlite`.
3. Scheduling engine receives tasks, fixed events, and preferences; returns blocks.
4. Blocks are persisted and rendered.

## State management

- **TanStack Query**: Server/repository state and cache invalidation.
- **React state**: Component-local UI state.
- **Zustand**: Reserved for active focus session and modal state.

## Security

- No privileged keys in client.
- Calendar is read-only by default.
- Notifications are opt-in.
