import { getDatabase } from './connection';
import { SCHEMA } from './schema';

const MIGRATIONS: string[] = [
  `PRAGMA journal_mode = WAL;`,
  SCHEMA.user_preferences,
  SCHEMA.tasks,
  SCHEMA.schedule_blocks,
  SCHEMA.fixed_events,
  SCHEMA.calendar_sources,
  SCHEMA.calendar_events,
  SCHEMA.focus_sessions,
  SCHEMA.inbox_captures,
  SCHEMA.daily_metrics,
  SCHEMA.task_dependencies,
  SCHEMA.schedule_runs,
];

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(MIGRATIONS.join('\n'));
}

export async function resetDatabase(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync(`
    DROP TABLE IF EXISTS user_preferences;
    DROP TABLE IF EXISTS tasks;
    DROP TABLE IF EXISTS schedule_blocks;
    DROP TABLE IF EXISTS fixed_events;
    DROP TABLE IF EXISTS calendar_sources;
    DROP TABLE IF EXISTS calendar_events;
    DROP TABLE IF EXISTS focus_sessions;
    DROP TABLE IF EXISTS inbox_captures;
    DROP TABLE IF EXISTS daily_metrics;
    DROP TABLE IF EXISTS task_dependencies;
    DROP TABLE IF EXISTS schedule_runs;
  `);
  await runMigrations();
}
