import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import { buildSchedule } from './engine';
import type { Task } from '@/src/types';

function at(date: Date, hour: number, minute: number): Date {
  return setMinutes(setHours(startOfDay(date), hour), minute);
}

function baseTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Math.random().toString(36).slice(2)}`,
    title: 'Test task',
    notes: '',
    status: 'planned',
    priority: 'medium',
    estimatedDurationMinutes: 60,
    remainingDurationMinutes: 60,
    preferredTimeOfDay: 'any',
    energyRequirement: 'medium',
    context: 'computer',
    projectOrCategory: '',
    splittable: false,
    minimumChunkMinutes: 15,
    dependencyIds: [],
    isFixed: false,
    nonNegotiable: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const baseRequest = {
  tasks: [] as Task[],
  fixedEvents: [] as { id: string; title: string; start: Date; end: Date; isAllDay: boolean }[],
  availability: { start: '09:00', end: '17:00' },
  energyProfile: { morning: 'high' as const, afternoon: 'medium' as const, evening: 'low' as const },
  breakRules: { minimumBreakMinutes: 10, focusSessionMinutes: 50, longBreakMinutes: 20 },
  prepBufferMinutes: 15,
  travelBufferMinutes: 0,
  dailyFocusMaxMinutes: 6 * 60,
};

describe('buildSchedule', () => {
  it('produces no overlapping blocks', () => {
    const today = startOfDay(new Date());
    const tasks = [baseTask({ title: 'A', estimatedDurationMinutes: 60, remainingDurationMinutes: 60 })];
    const result = buildSchedule({
      rangeStart: today,
      rangeEnd: addDays(today, 1),
      now: at(today, 8, 0),
      ...baseRequest,
      tasks,
    });

    for (let i = 0; i < result.blocks.length; i++) {
      for (let j = i + 1; j < result.blocks.length; j++) {
        const a = result.blocks[i];
        const b = result.blocks[j];
        if (!a || !b) continue;
        const aStart = new Date(a.start);
        const aEnd = new Date(a.end);
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        expect(aStart < bEnd && aEnd > bStart).toBe(false);
      }
    }
  });

  it('never moves fixed events', () => {
    const today = startOfDay(new Date());
    const fixedStart = at(today, 10, 0);
    const fixedEnd = at(today, 11, 0);
    const result = buildSchedule({
      rangeStart: today,
      rangeEnd: addDays(today, 1),
      now: at(today, 8, 0),
      ...baseRequest,
      tasks: [],
      fixedEvents: [{ id: 'fixed-1', title: 'Meeting', start: fixedStart, end: fixedEnd, isAllDay: false }],
    });

    const fixedBlocks = result.blocks.filter((b) => b.isFixed);
    expect(fixedBlocks).toHaveLength(1);
    const fixedBlock = fixedBlocks[0];
    expect(fixedBlock).toBeDefined();
    expect(new Date(fixedBlock!.start).getTime()).toBe(fixedStart.getTime());
    expect(new Date(fixedBlock!.end).getTime()).toBe(fixedEnd.getTime());
  });

  it('does not schedule tasks before earliest start', () => {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);
    const task = baseTask({ earliestStart: tomorrow.toISOString() });
    const result = buildSchedule({
      rangeStart: today,
      rangeEnd: addDays(today, 2),
      now: at(today, 8, 0),
      ...baseRequest,
      tasks: [task],
    });

    const scheduled = result.blocks.find((b) => b.taskId === task.id);
    expect(scheduled).toBeDefined();
    if (scheduled) {
      expect(new Date(scheduled.start).getTime()).toBeGreaterThanOrEqual(tomorrow.getTime());
    }
  });

  it('respects non-splittable tasks by keeping them intact', () => {
    const today = startOfDay(new Date());
    const task = baseTask({ title: 'Non-splittable', estimatedDurationMinutes: 90, remainingDurationMinutes: 90, splittable: false });
    const result = buildSchedule({
      rangeStart: today,
      rangeEnd: addDays(today, 1),
      now: at(today, 8, 0),
      ...baseRequest,
      tasks: [task],
    });

    const block = result.blocks.find((b) => b.taskId === task.id);
    expect(block).toBeDefined();
    if (block) {
      expect(block.durationMinutes).toBe(90);
    }
  });

  it('returns unscheduled tasks instead of discarding them', () => {
    const today = startOfDay(new Date());
    const task = baseTask({ title: 'Too big', estimatedDurationMinutes: 600, remainingDurationMinutes: 600, splittable: true });
    const result = buildSchedule({
      rangeStart: today,
      rangeEnd: addDays(today, 1),
      now: at(today, 8, 0),
      ...baseRequest,
      tasks: [task],
    });

    expect(result.unscheduledTaskIds).toContain(task.id);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('produces deterministic output for identical input', () => {
    const today = startOfDay(new Date());
    const tasks = [baseTask({ estimatedDurationMinutes: 45, remainingDurationMinutes: 45 })];
    const params = {
      rangeStart: today,
      rangeEnd: addDays(today, 1),
      now: at(today, 8, 0),
      ...baseRequest,
      tasks,
    };

    const a = buildSchedule(params);
    const b = buildSchedule(params);
    expect(a.blocks.map((x) => x.start)).toEqual(b.blocks.map((x) => x.start));
    expect(a.unscheduledTaskIds).toEqual(b.unscheduledTaskIds);
  });
});
