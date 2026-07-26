# Database

`expo-sqlite` is the primary V1 database. Migrations run automatically on launch.

## Tables

- `user_preferences` — singleton onboarding/settings record
- `tasks` — flexible and fixed tasks
- `schedule_blocks` — generated schedule blocks
- `fixed_events` — imported fixed calendar events
- `calendar_sources` / `calendar_events` — device/local calendar data
- `focus_sessions` — focus timer records
- `inbox_captures` — unconfirmed natural-language captures
- `daily_metrics` — per-day aggregate stats
- `task_dependencies` — task dependency graph
- `schedule_runs` — history of scheduling passes

## Migrations

`src/database/migrations.ts` runs `PRAGMA journal_mode = WAL` then creates tables and indexes. `resetDatabase()` drops and recreates everything.

## Repositories

`src/database/repositories/index.ts` contains all data-access functions and maps rows to domain types. JSON arrays are stored as strings.

## Web fallback

The web build uses `expo-sqlite`'s bundled `wa-sqlite` worker. `metro.config.js` adds `.wasm` to Metro asset extensions so the worker can be bundled.
