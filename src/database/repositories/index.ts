import { getDatabase } from '../connection';
import type {
  CalendarEvent,
  CalendarSource,
  DailyMetrics,
  FixedEvent,
  FocusSession,
  InboxCapture,
  RecurrenceRule,
  ScheduleBlock,
  ScheduleRun,
  Task,
  UserPreferences,
} from '@/src/types';

function now(): string {
  return new Date().toISOString();
}

function boolToInt(value: boolean): number {
  return value ? 1 : 0;
}

function intToBool(value: number | null): boolean {
  return value === 1;
}

export const userPreferencesRepo = {
  async get(): Promise<UserPreferences | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM user_preferences LIMIT 1',
    );
    if (!row) return null;
    return mapPreferences(row);
  },

  async upsert(prefs: Partial<UserPreferences>): Promise<void> {
    const db = await getDatabase();
    const existing = await this.get();
    if (existing) {
      await db.runAsync(
        `UPDATE user_preferences SET
          name = ?, wake_time = ?, sleep_time = ?, workday_start = ?, workday_end = ?,
          preferred_focus_session_length = ?, minimum_break_length = ?, maximum_focused_work_hours_per_day = ?,
          morning_energy = ?, afternoon_energy = ?, evening_energy = ?,
          default_prep_buffer_minutes = ?, default_travel_buffer_minutes = ?, week_start_day = ?,
          notifications_enabled = ?, morning_brief_enabled = ?, evening_review_enabled = ?,
          onboarding_completed = ?, updated_at = ?
        WHERE id = 1`,
        prefs.name ?? existing.name,
        prefs.wakeTime ?? existing.wakeTime,
        prefs.sleepTime ?? existing.sleepTime,
        prefs.workdayStart ?? existing.workdayStart,
        prefs.workdayEnd ?? existing.workdayEnd,
        prefs.preferredFocusSessionLength ?? existing.preferredFocusSessionLength,
        prefs.minimumBreakLength ?? existing.minimumBreakLength,
        prefs.maximumFocusedWorkHoursPerDay ?? existing.maximumFocusedWorkHoursPerDay,
        prefs.morningEnergy ?? existing.morningEnergy,
        prefs.afternoonEnergy ?? existing.afternoonEnergy,
        prefs.eveningEnergy ?? existing.eveningEnergy,
        prefs.defaultPrepBufferMinutes ?? existing.defaultPrepBufferMinutes,
        prefs.defaultTravelBufferMinutes ?? existing.defaultTravelBufferMinutes,
        prefs.weekStartDay ?? existing.weekStartDay,
        boolToInt(prefs.notificationsEnabled ?? existing.notificationsEnabled),
        boolToInt(prefs.morningBriefEnabled ?? existing.morningBriefEnabled),
        boolToInt(prefs.eveningReviewEnabled ?? existing.eveningReviewEnabled),
        boolToInt(prefs.onboardingCompleted ?? existing.onboardingCompleted),
        now(),
      );
    } else {
      await db.runAsync(
        `INSERT INTO user_preferences (
          id, name, wake_time, sleep_time, workday_start, workday_end,
          preferred_focus_session_length, minimum_break_length, maximum_focused_work_hours_per_day,
          morning_energy, afternoon_energy, evening_energy,
          default_prep_buffer_minutes, default_travel_buffer_minutes, week_start_day,
          notifications_enabled, morning_brief_enabled, evening_review_enabled, onboarding_completed,
          created_at, updated_at
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        prefs.name ?? '',
        prefs.wakeTime ?? '07:00',
        prefs.sleepTime ?? '23:00',
        prefs.workdayStart ?? '09:00',
        prefs.workdayEnd ?? '17:00',
        prefs.preferredFocusSessionLength ?? 50,
        prefs.minimumBreakLength ?? 10,
        prefs.maximumFocusedWorkHoursPerDay ?? 6,
        prefs.morningEnergy ?? 'high',
        prefs.afternoonEnergy ?? 'medium',
        prefs.eveningEnergy ?? 'low',
        prefs.defaultPrepBufferMinutes ?? 15,
        prefs.defaultTravelBufferMinutes ?? 0,
        prefs.weekStartDay ?? 0,
        boolToInt(prefs.notificationsEnabled ?? true),
        boolToInt(prefs.morningBriefEnabled ?? true),
        boolToInt(prefs.eveningReviewEnabled ?? true),
        boolToInt(prefs.onboardingCompleted ?? false),
        now(),
        now(),
      );
    }
  },
};

function mapPreferences(row: Record<string, unknown>): UserPreferences {
  return {
    id: row.id as number,
    name: (row.name as string) ?? '',
    wakeTime: (row.wake_time as string) ?? '07:00',
    sleepTime: (row.sleep_time as string) ?? '23:00',
    workdayStart: (row.workday_start as string) ?? '09:00',
    workdayEnd: (row.workday_end as string) ?? '17:00',
    preferredFocusSessionLength: (row.preferred_focus_session_length as number) ?? 50,
    minimumBreakLength: (row.minimum_break_length as number) ?? 10,
    maximumFocusedWorkHoursPerDay: (row.maximum_focused_work_hours_per_day as number) ?? 6,
    morningEnergy: (row.morning_energy as UserPreferences['morningEnergy']) ?? 'high',
    afternoonEnergy: (row.afternoon_energy as UserPreferences['afternoonEnergy']) ?? 'medium',
    eveningEnergy: (row.evening_energy as UserPreferences['eveningEnergy']) ?? 'low',
    defaultPrepBufferMinutes: (row.default_prep_buffer_minutes as number) ?? 15,
    defaultTravelBufferMinutes: (row.default_travel_buffer_minutes as number) ?? 0,
    weekStartDay: (row.week_start_day as number) ?? 0,
    notificationsEnabled: intToBool(row.notifications_enabled as number | null),
    morningBriefEnabled: intToBool(row.morning_brief_enabled as number | null),
    eveningReviewEnabled: intToBool(row.evening_review_enabled as number | null),
    onboardingCompleted: intToBool(row.onboarding_completed as number | null),
    createdAt: (row.created_at as string) ?? now(),
    updatedAt: (row.updated_at as string) ?? now(),
  };
}

export const tasksRepo = {
  async getAll(): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM tasks ORDER BY created_at DESC');
    return rows.map(mapTask);
  },

  async getByStatus(status: Task['status']): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC',
      status,
    );
    return rows.map(mapTask);
  },

  async getById(id: string): Promise<Task | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM tasks WHERE id = ?', id);
    return row ? mapTask(row) : null;
  },

  async getActive(): Promise<Task[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM tasks WHERE status IN ('inbox','planned','in_progress') ORDER BY priority DESC, deadline ASC",
    );
    return rows.map(mapTask);
  },

  async save(task: Task): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO tasks (
        id, title, notes, status, priority, estimated_duration_minutes, remaining_duration_minutes,
        deadline, earliest_start, preferred_time_of_day, energy_requirement, context, project_or_category,
        splittable, minimum_chunk_minutes, maximum_chunk_minutes, dependency_ids, recurrence_rule,
        is_fixed, non_negotiable, created_at, updated_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      task.id,
      task.title,
      task.notes,
      task.status,
      task.priority,
      task.estimatedDurationMinutes,
      task.remainingDurationMinutes,
      task.deadline ?? null,
      task.earliestStart ?? null,
      task.preferredTimeOfDay,
      task.energyRequirement,
      task.context,
      task.projectOrCategory,
      boolToInt(task.splittable),
      task.minimumChunkMinutes,
      task.maximumChunkMinutes ?? null,
      JSON.stringify(task.dependencyIds),
      task.recurrenceRule ? JSON.stringify(task.recurrenceRule) : null,
      boolToInt(task.isFixed),
      boolToInt(task.nonNegotiable),
      task.createdAt,
      task.updatedAt,
      task.completedAt ?? null,
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
    await db.runAsync('DELETE FROM schedule_blocks WHERE task_id = ?', id);
    await db.runAsync('DELETE FROM task_dependencies WHERE task_id = ? OR depends_on_task_id = ?', id, id);
  },
};

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    title: (row.title as string) ?? '',
    notes: (row.notes as string) ?? '',
    status: (row.status as Task['status']) ?? 'inbox',
    priority: (row.priority as Task['priority']) ?? 'medium',
    estimatedDurationMinutes: (row.estimated_duration_minutes as number) ?? 30,
    remainingDurationMinutes: (row.remaining_duration_minutes as number) ?? 30,
    deadline: (row.deadline as string | undefined) ?? undefined,
    earliestStart: (row.earliest_start as string | undefined) ?? undefined,
    preferredTimeOfDay: (row.preferred_time_of_day as Task['preferredTimeOfDay']) ?? 'any',
    energyRequirement: (row.energy_requirement as Task['energyRequirement']) ?? 'medium',
    context: (row.context as Task['context']) ?? 'computer',
    projectOrCategory: (row.project_or_category as string) ?? '',
    splittable: intToBool(row.splittable as number | null),
    minimumChunkMinutes: (row.minimum_chunk_minutes as number) ?? 15,
    maximumChunkMinutes: (row.maximum_chunk_minutes as number | undefined) ?? undefined,
    dependencyIds: safeJsonParse(row.dependency_ids as string, []),
    recurrenceRule: safeJsonParse<RecurrenceRule | undefined>(row.recurrence_rule as string | undefined, undefined),
    isFixed: intToBool(row.is_fixed as number | null),
    nonNegotiable: intToBool(row.non_negotiable as number | null),
    createdAt: (row.created_at as string) ?? now(),
    updatedAt: (row.updated_at as string) ?? now(),
    completedAt: (row.completed_at as string | undefined) ?? undefined,
  };
}

export const scheduleBlocksRepo = {
  async getAll(): Promise<ScheduleBlock[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM schedule_blocks ORDER BY start ASC',
    );
    return rows.map(mapBlock);
  },

  async getByDate(date: Date): Promise<ScheduleBlock[]> {
    const db = await getDatabase();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM schedule_blocks WHERE start >= ? AND start <= ? ORDER BY start ASC',
      start.toISOString(),
      end.toISOString(),
    );
    return rows.map(mapBlock);
  },

  async save(block: ScheduleBlock): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO schedule_blocks (
        id, task_id, title, start, end, duration_minutes, is_fixed, locked, explanation, context, energy_requirement, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      block.id,
      block.taskId,
      block.title,
      block.start,
      block.end,
      block.durationMinutes,
      boolToInt(block.isFixed),
      boolToInt(block.locked),
      block.explanation,
      block.context,
      block.energyRequirement,
      block.createdAt,
      block.updatedAt,
    );
  },

  async deleteForDate(date: Date): Promise<void> {
    const db = await getDatabase();
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    await db.runAsync('DELETE FROM schedule_blocks WHERE start >= ? AND start <= ? AND locked = 0', start.toISOString(), end.toISOString());
  },

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM schedule_blocks');
  },
};

function mapBlock(row: Record<string, unknown>): ScheduleBlock {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    title: (row.title as string) ?? '',
    start: (row.start as string) ?? now(),
    end: (row.end as string) ?? now(),
    durationMinutes: (row.duration_minutes as number) ?? 0,
    isFixed: intToBool(row.is_fixed as number | null),
    locked: intToBool(row.locked as number | null),
    explanation: (row.explanation as string) ?? '',
    context: (row.context as ScheduleBlock['context']) ?? 'computer',
    energyRequirement: (row.energy_requirement as ScheduleBlock['energyRequirement']) ?? 'medium',
    createdAt: (row.created_at as string) ?? now(),
    updatedAt: (row.updated_at as string) ?? now(),
  };
}

export const fixedEventsRepo = {
  async getAll(): Promise<FixedEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM fixed_events ORDER BY start ASC',
    );
    return rows.map(mapFixedEvent);
  },

  async getByDateRange(start: Date, end: Date): Promise<FixedEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM fixed_events WHERE start >= ? AND start <= ? ORDER BY start ASC',
      start.toISOString(),
      end.toISOString(),
    );
    return rows.map(mapFixedEvent);
  },

  async save(event: FixedEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO fixed_events (id, external_id, calendar_source_id, title, start, end, location, is_all_day, imported_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      event.id,
      event.externalId ?? null,
      event.calendarSourceId ?? null,
      event.title,
      event.start,
      event.end,
      event.location ?? null,
      boolToInt(event.isAllDay),
      event.importedAt,
    );
  },

  async deleteAll(): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM fixed_events');
  },
};

function mapFixedEvent(row: Record<string, unknown>): FixedEvent {
  return {
    id: row.id as string,
    externalId: (row.external_id as string | undefined) ?? undefined,
    calendarSourceId: (row.calendar_source_id as string | undefined) ?? undefined,
    title: (row.title as string) ?? '',
    start: (row.start as string) ?? now(),
    end: (row.end as string) ?? now(),
    location: (row.location as string | undefined) ?? undefined,
    isAllDay: intToBool(row.is_all_day as number | null),
    importedAt: (row.imported_at as string) ?? now(),
  };
}

export const focusSessionsRepo = {
  async getAll(): Promise<FocusSession[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      'SELECT * FROM focus_sessions ORDER BY started_at DESC',
    );
    return rows.map(mapFocusSession);
  },

  async getActive(): Promise<FocusSession | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      'SELECT * FROM focus_sessions WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1',
    );
    return row ? mapFocusSession(row) : null;
  },

  async save(session: FocusSession): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO focus_sessions (
        id, task_id, started_at, ended_at, planned_duration_minutes, actual_duration_minutes,
        paused_seconds, distractions, completed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      session.id,
      session.taskId,
      session.startedAt,
      session.endedAt ?? null,
      session.plannedDurationMinutes,
      session.actualDurationMinutes ?? null,
      session.pausedSeconds,
      JSON.stringify(session.distractions),
      boolToInt(session.completed),
      session.createdAt,
      session.updatedAt,
    );
  },
};

function mapFocusSession(row: Record<string, unknown>): FocusSession {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    startedAt: (row.started_at as string) ?? now(),
    endedAt: (row.ended_at as string | undefined) ?? undefined,
    plannedDurationMinutes: (row.planned_duration_minutes as number) ?? 0,
    actualDurationMinutes: (row.actual_duration_minutes as number | undefined) ?? undefined,
    pausedSeconds: (row.paused_seconds as number) ?? 0,
    distractions: safeJsonParse(row.distractions as string, []),
    completed: intToBool(row.completed as number | null),
    createdAt: (row.created_at as string) ?? now(),
    updatedAt: (row.updated_at as string) ?? now(),
  };
}

export const inboxCapturesRepo = {
  async getAll(): Promise<InboxCapture[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>(
      "SELECT * FROM inbox_captures WHERE status = 'inbox' ORDER BY created_at DESC",
    );
    return rows.map(mapInboxCapture);
  },

  async save(capture: InboxCapture): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO inbox_captures (
        id, raw_input, parsed_title, parsed_duration_minutes, parsed_deadline,
        parsed_preferred_time_of_day, parsed_priority, parsed_energy, parsed_context,
        parsed_recurrence, confidence, confirmed, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      capture.id,
      capture.rawInput,
      capture.parsedTitle ?? null,
      capture.parsedDurationMinutes ?? null,
      capture.parsedDeadline ?? null,
      capture.parsedPreferredTimeOfDay ?? null,
      capture.parsedPriority ?? null,
      capture.parsedEnergy ?? null,
      capture.parsedContext ?? null,
      capture.parsedRecurrence ? JSON.stringify(capture.parsedRecurrence) : null,
      capture.confidence,
      boolToInt(capture.confirmed),
      capture.status,
      capture.createdAt,
      capture.updatedAt,
    );
  },

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM inbox_captures WHERE id = ?', id);
  },
};

function mapInboxCapture(row: Record<string, unknown>): InboxCapture {
  return {
    id: row.id as string,
    rawInput: (row.raw_input as string) ?? '',
    parsedTitle: (row.parsed_title as string | undefined) ?? undefined,
    parsedDurationMinutes: (row.parsed_duration_minutes as number | undefined) ?? undefined,
    parsedDeadline: (row.parsed_deadline as string | undefined) ?? undefined,
    parsedPreferredTimeOfDay: (row.parsed_preferred_time_of_day as InboxCapture['parsedPreferredTimeOfDay']) ?? undefined,
    parsedPriority: (row.parsed_priority as InboxCapture['parsedPriority']) ?? undefined,
    parsedEnergy: (row.parsed_energy as InboxCapture['parsedEnergy']) ?? undefined,
    parsedContext: (row.parsed_context as InboxCapture['parsedContext']) ?? undefined,
    parsedRecurrence: safeJsonParse<RecurrenceRule | undefined>(row.parsed_recurrence as string | undefined, undefined),
    confidence: (row.confidence as number) ?? 0,
    confirmed: intToBool(row.confirmed as number | null),
    status: (row.status as InboxCapture['status']) ?? 'inbox',
    createdAt: (row.created_at as string) ?? now(),
    updatedAt: (row.updated_at as string) ?? now(),
  };
}

export const dailyMetricsRepo = {
  async getByDate(date: string): Promise<DailyMetrics | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>('SELECT * FROM daily_metrics WHERE date = ?', date);
    return row ? mapDailyMetrics(row) : null;
  },

  async save(metric: DailyMetrics): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO daily_metrics (
        id, date, planned_minutes, completed_minutes, focus_sessions_completed, reschedules, overload_warnings, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      metric.id,
      metric.date,
      metric.plannedMinutes,
      metric.completedMinutes,
      metric.focusSessionsCompleted,
      metric.reschedules,
      metric.overloadWarnings,
      metric.createdAt,
      metric.updatedAt,
    );
  },
};

function mapDailyMetrics(row: Record<string, unknown>): DailyMetrics {
  return {
    id: (row.id as number) ?? 0,
    date: (row.date as string) ?? '',
    plannedMinutes: (row.planned_minutes as number) ?? 0,
    completedMinutes: (row.completed_minutes as number) ?? 0,
    focusSessionsCompleted: (row.focus_sessions_completed as number) ?? 0,
    reschedules: (row.reschedules as number) ?? 0,
    overloadWarnings: (row.overload_warnings as number) ?? 0,
    createdAt: (row.created_at as string) ?? now(),
    updatedAt: (row.updated_at as string) ?? now(),
  };
}

export const scheduleRunsRepo = {
  async save(run: ScheduleRun): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO schedule_runs (
        id, ran_at, range_start, range_end, blocks_created, unscheduled_task_ids, warnings, explanations, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      run.id,
      run.ranAt,
      run.rangeStart,
      run.rangeEnd,
      run.blocksCreated,
      JSON.stringify(run.unscheduledTaskIds),
      JSON.stringify(run.warnings),
      JSON.stringify(run.explanations),
      run.createdAt,
    );
  },
};

export const calendarSourcesRepo = {
  async getAll(): Promise<CalendarSource[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM calendar_sources ORDER BY name ASC');
    return rows.map(mapCalendarSource);
  },

  async save(source: CalendarSource): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO calendar_sources (id, name, type, enabled, external_id, color, last_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      source.id,
      source.name,
      source.type,
      boolToInt(source.enabled),
      source.externalId ?? null,
      source.color ?? null,
      source.lastSyncedAt ?? null,
      source.createdAt,
      source.updatedAt,
    );
  },
};

function mapCalendarSource(row: Record<string, unknown>): CalendarSource {
  return {
    id: row.id as string,
    name: (row.name as string) ?? '',
    type: (row.type as CalendarSource['type']) ?? 'local',
    enabled: intToBool(row.enabled as number | null),
    externalId: (row.external_id as string | undefined) ?? undefined,
    color: (row.color as string | undefined) ?? undefined,
    lastSyncedAt: (row.last_synced_at as string | undefined) ?? undefined,
    createdAt: (row.created_at as string) ?? now(),
    updatedAt: (row.updated_at as string) ?? now(),
  };
}

export const calendarEventsRepo = {
  async getAll(): Promise<CalendarEvent[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<Record<string, unknown>>('SELECT * FROM calendar_events ORDER BY start ASC');
    return rows.map(mapCalendarEvent);
  },

  async save(event: CalendarEvent): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      `INSERT OR REPLACE INTO calendar_events (id, source_id, external_id, title, start, end, is_all_day, location, imported_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      event.id,
      event.sourceId,
      event.externalId ?? null,
      event.title,
      event.start,
      event.end,
      boolToInt(event.isAllDay),
      event.location ?? null,
      event.importedAt,
    );
  },
};

function mapCalendarEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    sourceId: row.source_id as string,
    externalId: (row.external_id as string | undefined) ?? undefined,
    title: (row.title as string) ?? '',
    start: (row.start as string) ?? now(),
    end: (row.end as string) ?? now(),
    isAllDay: intToBool(row.is_all_day as number | null),
    location: (row.location as string | undefined) ?? undefined,
    importedAt: (row.imported_at as string) ?? now(),
  };
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
