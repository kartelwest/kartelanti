export const SCHEMA = {
  user_preferences: `
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT '',
      wake_time TEXT NOT NULL DEFAULT '07:00',
      sleep_time TEXT NOT NULL DEFAULT '23:00',
      workday_start TEXT NOT NULL DEFAULT '09:00',
      workday_end TEXT NOT NULL DEFAULT '17:00',
      preferred_focus_session_length INTEGER NOT NULL DEFAULT 50,
      minimum_break_length INTEGER NOT NULL DEFAULT 10,
      maximum_focused_work_hours_per_day INTEGER NOT NULL DEFAULT 6,
      morning_energy TEXT NOT NULL DEFAULT 'high',
      afternoon_energy TEXT NOT NULL DEFAULT 'medium',
      evening_energy TEXT NOT NULL DEFAULT 'low',
      default_prep_buffer_minutes INTEGER NOT NULL DEFAULT 15,
      default_travel_buffer_minutes INTEGER NOT NULL DEFAULT 0,
      week_start_day INTEGER NOT NULL DEFAULT 0,
      notifications_enabled INTEGER NOT NULL DEFAULT 1,
      morning_brief_enabled INTEGER NOT NULL DEFAULT 1,
      evening_review_enabled INTEGER NOT NULL DEFAULT 1,
      onboarding_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `,
  tasks: `
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'inbox',
      priority TEXT NOT NULL DEFAULT 'medium',
      estimated_duration_minutes INTEGER NOT NULL DEFAULT 30,
      remaining_duration_minutes INTEGER NOT NULL DEFAULT 30,
      deadline TEXT,
      earliest_start TEXT,
      preferred_time_of_day TEXT NOT NULL DEFAULT 'any',
      energy_requirement TEXT NOT NULL DEFAULT 'medium',
      context TEXT NOT NULL DEFAULT 'computer',
      project_or_category TEXT NOT NULL DEFAULT '',
      splittable INTEGER NOT NULL DEFAULT 0,
      minimum_chunk_minutes INTEGER NOT NULL DEFAULT 15,
      maximum_chunk_minutes INTEGER,
      dependency_ids TEXT NOT NULL DEFAULT '[]',
      recurrence_rule TEXT,
      is_fixed INTEGER NOT NULL DEFAULT 0,
      non_negotiable INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
    CREATE INDEX IF NOT EXISTS idx_tasks_earliest_start ON tasks(earliest_start);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
  `,
  schedule_blocks: `
    CREATE TABLE IF NOT EXISTS schedule_blocks (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      is_fixed INTEGER NOT NULL DEFAULT 0,
      locked INTEGER NOT NULL DEFAULT 0,
      explanation TEXT NOT NULL DEFAULT '',
      context TEXT NOT NULL DEFAULT 'computer',
      energy_requirement TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_blocks_start ON schedule_blocks(start);
    CREATE INDEX IF NOT EXISTS idx_blocks_task ON schedule_blocks(task_id);
  `,
  fixed_events: `
    CREATE TABLE IF NOT EXISTS fixed_events (
      id TEXT PRIMARY KEY,
      external_id TEXT,
      calendar_source_id TEXT,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      location TEXT,
      is_all_day INTEGER NOT NULL DEFAULT 0,
      imported_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fixed_events_start ON fixed_events(start);
  `,
  calendar_sources: `
    CREATE TABLE IF NOT EXISTS calendar_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'local',
      enabled INTEGER NOT NULL DEFAULT 1,
      external_id TEXT,
      color TEXT,
      last_synced_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,
  calendar_events: `
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      external_id TEXT,
      title TEXT NOT NULL,
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      is_all_day INTEGER NOT NULL DEFAULT 0,
      location TEXT,
      imported_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start);
  `,
  focus_sessions: `
    CREATE TABLE IF NOT EXISTS focus_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      planned_duration_minutes INTEGER NOT NULL,
      actual_duration_minutes INTEGER,
      paused_seconds INTEGER NOT NULL DEFAULT 0,
      distractions TEXT NOT NULL DEFAULT '[]',
      completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_focus_sessions_task ON focus_sessions(task_id);
  `,
  inbox_captures: `
    CREATE TABLE IF NOT EXISTS inbox_captures (
      id TEXT PRIMARY KEY,
      raw_input TEXT NOT NULL,
      parsed_title TEXT,
      parsed_duration_minutes INTEGER,
      parsed_deadline TEXT,
      parsed_preferred_time_of_day TEXT,
      parsed_priority TEXT,
      parsed_energy TEXT,
      parsed_context TEXT,
      parsed_recurrence TEXT,
      confidence REAL NOT NULL DEFAULT 0,
      confirmed INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'inbox',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_inbox_status ON inbox_captures(status);
  `,
  daily_metrics: `
    CREATE TABLE IF NOT EXISTS daily_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      planned_minutes INTEGER NOT NULL DEFAULT 0,
      completed_minutes INTEGER NOT NULL DEFAULT 0,
      focus_sessions_completed INTEGER NOT NULL DEFAULT 0,
      reschedules INTEGER NOT NULL DEFAULT 0,
      overload_warnings INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
  `,
  task_dependencies: `
    CREATE TABLE IF NOT EXISTS task_dependencies (
      task_id TEXT NOT NULL,
      depends_on_task_id TEXT NOT NULL,
      PRIMARY KEY (task_id, depends_on_task_id)
    );
    CREATE INDEX IF NOT EXISTS idx_task_dependencies ON task_dependencies(task_id);
  `,
  schedule_runs: `
    CREATE TABLE IF NOT EXISTS schedule_runs (
      id TEXT PRIMARY KEY,
      ran_at TEXT NOT NULL,
      range_start TEXT NOT NULL,
      range_end TEXT NOT NULL,
      blocks_created INTEGER NOT NULL DEFAULT 0,
      unscheduled_task_ids TEXT NOT NULL DEFAULT '[]',
      warnings TEXT NOT NULL DEFAULT '[]',
      explanations TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );
  `,
};
