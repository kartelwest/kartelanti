import { addDays, addMinutes, differenceInMinutes, isAfter, isBefore, isSameDay, setHours, setMinutes, startOfDay } from 'date-fns';
import type { ConfidenceLevel, EnergyLevel, ScheduleBlock, ScheduleResult, Task, TimeOfDay } from '@/src/types';

export interface ScheduleRequest {
  rangeStart: Date;
  rangeEnd: Date;
  now: Date;
  tasks: Task[];
  fixedEvents: { id: string; title: string; start: Date; end: Date; isAllDay: boolean }[];
  availability: { start: string; end: string };
  energyProfile: { morning: EnergyLevel; afternoon: EnergyLevel; evening: EnergyLevel };
  breakRules: { minimumBreakMinutes: number; focusSessionMinutes: number; longBreakMinutes: number };
  prepBufferMinutes: number;
  travelBufferMinutes: number;
  dailyFocusMaxMinutes: number;
  recoveryMode?: boolean;
}

interface FreeInterval {
  start: Date;
  end: Date;
}

interface ScoredTask {
  task: Task;
  score: number;
  reasons: string[];
  earliest: Date;
  deadline: Date | undefined;
}

const TIME_OF_DAY_WEIGHTS: Record<TimeOfDay, { startHour: number; endHour: number }> = {
  morning: { startHour: 5, endHour: 12 },
  afternoon: { startHour: 12, endHour: 18 },
  evening: { startHour: 18, endHour: 22 },
  any: { startHour: 0, endHour: 24 },
};

const ENERGY_SCORES: Record<EnergyLevel, number> = { low: 1, medium: 2, high: 3 };

function segmentOfDay(date: Date): 'morning' | 'afternoon' | 'evening' {
  const h = date.getHours();
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

function applyTime(date: Date, time: string): Date {
  const [hStr, mStr] = time.split(':');
  const hours = parseInt(hStr ?? '0', 10);
  const minutes = parseInt(mStr ?? '0', 10);
  return setMinutes(setHours(startOfDay(date), Number.isNaN(hours) ? 0 : hours), Number.isNaN(minutes) ? 0 : minutes);
}

export function buildSchedule(request: ScheduleRequest): ScheduleResult {
  const { rangeStart, rangeEnd, now, tasks, fixedEvents, availability, energyProfile, breakRules } = request;

  const allBlocks: ScheduleBlock[] = [];
  const warnings: string[] = [];
  const explanations: string[] = [];
  const unscheduledTaskIds: string[] = [];
  const metrics = {
    totalScheduledMinutes: 0,
    totalAvailableMinutes: 0,
    fixedEventMinutes: 0,
    breakMinutes: 0,
    unscheduledMinutes: 0,
    tightTransitions: 0,
  };

  const flexibleTasks = tasks.filter((t) => !t.isFixed && t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter((t) => t.status === 'completed');

  const dateCursor = new Date(rangeStart);

  while (isBefore(dateCursor, rangeEnd) || isSameDay(dateCursor, rangeEnd)) {
    const dayStart = applyTime(dateCursor, availability.start);
    const dayEnd = applyTime(dateCursor, availability.end);

    if (isBefore(dayEnd, now) && request.recoveryMode) {
      warnings.push(`${formatDate(dateCursor)} is in the past; preserving completed work only.`);
      dateCursor.setDate(dateCursor.getDate() + 1);
      continue;
    }

    const dayFixed = fixedEvents
      .filter((e) => overlaps(e.start, e.end, dayStart, dayEnd) || isSameDay(e.start, dateCursor))
      .filter((e) => !e.isAllDay);

    const busyIntervals: FreeInterval[] = [];
    for (const fixed of dayFixed) {
      const start = isBefore(fixed.start, dayStart) ? dayStart : fixed.start;
      const end = isAfter(fixed.end, dayEnd) ? dayEnd : fixed.end;
      busyIntervals.push({ start, end });
      metrics.fixedEventMinutes += differenceInMinutes(end, start);
      allBlocks.push({
        id: generateId('fixed'),
        taskId: fixed.id,
        title: fixed.title,
        start: start.toISOString(),
        end: end.toISOString(),
        durationMinutes: differenceInMinutes(end, start),
        isFixed: true,
        locked: true,
        explanation: 'Fixed calendar commitment.',
        context: 'work',
        energyRequirement: 'medium',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    const freeIntervals = generateFreeIntervals(dayStart, dayEnd, busyIntervals, breakRules.minimumBreakMinutes);
    for (const interval of freeIntervals) {
      metrics.totalAvailableMinutes += differenceInMinutes(interval.end, interval.start);
    }

    const scoredTasks = scoreTasks(
      flexibleTasks,
      dateCursor,
      energyProfile,
      request,
      completedTasks,
    );

    const placed = placeTasksForDay(
      scoredTasks,
      freeIntervals,
      dayStart,
      dayEnd,
      dateCursor,
      request,
      now,
      metrics,
      warnings,
      explanations,
    );
    allBlocks.push(...placed.blocks);
    unscheduledTaskIds.push(...placed.unscheduled);

    dateCursor.setDate(dateCursor.getDate() + 1);
  }

  metrics.totalScheduledMinutes = allBlocks.reduce((sum, b) => sum + b.durationMinutes, 0);
  metrics.unscheduledMinutes = flexibleTasks
    .filter((t) => unscheduledTaskIds.includes(t.id))
    .reduce((sum, t) => sum + t.remainingDurationMinutes, 0);

  const confidence = calculateConfidence(metrics, unscheduledTaskIds.length, warnings.length, flexibleTasks.length);

  return {
    blocks: allBlocks,
    unscheduledTaskIds,
    warnings,
    confidence,
    explanations,
    metrics,
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function generateFreeIntervals(dayStart: Date, dayEnd: Date, busy: FreeInterval[], breakMinutes: number): FreeInterval[] {
  const sortedBusy = [...busy].sort((a, b) => a.start.getTime() - b.start.getTime());
  const free: FreeInterval[] = [];
  let cursor = dayStart;

  for (const interval of sortedBusy) {
    if (isBefore(cursor, interval.start)) {
      const end = addMinutes(interval.start, -breakMinutes);
      if (isBefore(cursor, end)) {
        free.push({ start: new Date(cursor), end: new Date(end) });
      }
    }
    cursor = isAfter(interval.end, cursor) ? interval.end : cursor;
  }

  if (isBefore(cursor, dayEnd)) {
    free.push({ start: new Date(cursor), end: new Date(dayEnd) });
  }

  return free.filter((i) => differenceInMinutes(i.end, i.start) >= 10);
}

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isAfter(aEnd, bStart);
}

function scoreTasks(
  tasks: Task[],
  date: Date,
  energyProfile: ScheduleRequest['energyProfile'],
  request: ScheduleRequest,
  completedTasks: Task[],
): ScoredTask[] {
  const scored = tasks.map((task) => {
    let score = 0;
    const reasons: string[] = [];

    score += priorityScore(task.priority);

    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const daysUntil = differenceInMinutes(deadline, date) / (60 * 24);
      if (daysUntil <= 1) {
        score += 40;
        reasons.push('Deadline is approaching.');
      } else if (daysUntil <= 3) {
        score += 20;
        reasons.push('Deadline is within three days.');
      } else {
        score += 5;
      }
    }

    if (task.nonNegotiable) {
      score += 50;
      reasons.push('Non-negotiable task.');
    }

    const segment = segmentOfDay(date);
    const dayEnergy = energyProfile[segment];
    const energyMatch = ENERGY_SCORES[dayEnergy] - ENERGY_SCORES[task.energyRequirement];
    if (energyMatch >= 0) {
      score += 8;
      reasons.push('Energy profile matches task requirement.');
    } else {
      score -= 6;
      reasons.push('Task energy level is higher than current window.');
    }

    if (task.preferredTimeOfDay !== 'any') {
      const window = TIME_OF_DAY_WEIGHTS[task.preferredTimeOfDay];
      if (date.getHours() >= window.startHour && date.getHours() < window.endHour) {
        score += 6;
        reasons.push('Preferred time of day.');
      }
    }

    if (task.earliestStart && isBefore(date, new Date(task.earliestStart))) {
      score -= 100;
      reasons.push('Before earliest start.');
    }

    const dependenciesMet = task.dependencyIds.every((depId) =>
      completedTasks.some((c) => c.id === depId),
    );
    if (!dependenciesMet) {
      score -= 100;
      reasons.push('Dependencies not yet completed.');
    }

    if (task.splittable) score += 2;

    return {
      task,
      score,
      reasons,
      earliest: task.earliestStart ? new Date(task.earliestStart) : new Date(0),
      deadline: task.deadline ? new Date(task.deadline) : undefined,
    };
  });

  return scored.sort((a, b) => b.score - a.score);
}

function priorityScore(priority: Task['priority']): number {
  switch (priority) {
    case 'urgent':
      return 30;
    case 'high':
      return 20;
    case 'medium':
      return 10;
    case 'low':
    default:
      return 0;
  }
}

function placeTasksForDay(
  scoredTasks: ScoredTask[],
  freeIntervals: FreeInterval[],
  dayStart: Date,
  dayEnd: Date,
  date: Date,
  request: ScheduleRequest,
  now: Date,
  metrics: ScheduleResult['metrics'],
  warnings: string[],
  explanations: string[],
): { blocks: ScheduleBlock[]; unscheduled: string[] } {
  const blocks: ScheduleBlock[] = [];
  const unscheduled: string[] = [];
  const usedTaskMinutes: Record<string, number> = {};
  let dailyFocusUsed = 0;

  const remainingIntervals: FreeInterval[] = freeIntervals.map((i) => ({ start: new Date(i.start), end: new Date(i.end) }));

  for (const { task } of scoredTasks) {
    if (usedTaskMinutes[task.id] ?? 0 >= task.remainingDurationMinutes) continue;

    if (task.earliestStart && isBefore(date, new Date(task.earliestStart))) {
      unscheduled.push(task.id);
      continue;
    }

    const deadline = task.deadline ? new Date(task.deadline) : undefined;
    if (deadline && isAfter(addDays(dayStart, 1), deadline)) {
      // fall through to try to fit before deadline
    }

    let placed = false;
    const remaining = task.remainingDurationMinutes - (usedTaskMinutes[task.id] ?? 0);
    const chunkSize = task.splittable
      ? Math.min(remaining, task.maximumChunkMinutes ?? remaining, request.breakRules.focusSessionMinutes)
      : remaining;

    for (let i = 0; i < remainingIntervals.length; i++) {
      const interval = remainingIntervals[i];
      if (!interval) continue;
      if (differenceInMinutes(interval.end, interval.start) < Math.max(chunkSize, task.minimumChunkMinutes)) continue;
      if (dailyFocusUsed + chunkSize > request.dailyFocusMaxMinutes) break;

      const start = isBefore(interval.start, now) && isSameDay(interval.start, now) ? now : interval.start;
      if (isAfter(start, interval.end)) continue;

      const end = addMinutes(start, chunkSize);
      if (isAfter(end, interval.end)) continue;

      const explanation = buildExplanation(task, date, request.energyProfile);
      blocks.push({
        id: generateId('block'),
        taskId: task.id,
        title: task.title,
        start: start.toISOString(),
        end: end.toISOString(),
        durationMinutes: chunkSize,
        isFixed: false,
        locked: task.nonNegotiable,
        explanation,
        context: task.context,
        energyRequirement: task.energyRequirement,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });

      interval.start = end;
      usedTaskMinutes[task.id] = (usedTaskMinutes[task.id] ?? 0) + chunkSize;
      dailyFocusUsed += chunkSize;
      explanations.push(`${task.title}: ${explanation}`);
      placed = true;

      if ((usedTaskMinutes[task.id] ?? 0) >= task.remainingDurationMinutes) break;
    }

    if (!placed) {
      unscheduled.push(task.id);
      warnings.push(`Could not fit "${task.title}" on ${formatDate(date)}.`);
    } else if ((usedTaskMinutes[task.id] ?? 0) < task.remainingDurationMinutes) {
      unscheduled.push(task.id);
      warnings.push(`Only part of "${task.title}" fit on ${formatDate(date)}.`);
    }
  }

  return { blocks, unscheduled };
}

function buildExplanation(task: Task, date: Date, energyProfile: ScheduleRequest['energyProfile']): string {
  const parts: string[] = [];
  const segment = segmentOfDay(date);
  const dayEnergy = energyProfile[segment];

  if (task.energyRequirement === dayEnergy || ENERGY_SCORES[task.energyRequirement] <= ENERGY_SCORES[dayEnergy]) {
    parts.push(`Scheduled during ${segment} because it matches your ${task.energyRequirement} energy requirement.`);
  } else {
    parts.push(`Placed in ${segment} to meet the approaching deadline despite lower energy.`);
  }

  if (task.deadline) {
    parts.push(`Must finish before ${new Date(task.deadline).toLocaleDateString()}.`);
  }

  if (task.context) {
    parts.push(`Context: ${task.context}.`);
  }

  if (parts.length === 0) parts.push('Scheduled in next available focused window.');
  return parts.join(' ');
}

function calculateConfidence(
  metrics: ScheduleResult['metrics'],
  unscheduledCount: number,
  warningCount: number,
  totalTasks: number,
): { level: ConfidenceLevel; score: number; reasons: string[] } {
  let score = 100;
  const reasons: string[] = [];

  if (unscheduledCount > 0) {
    score -= unscheduledCount * 15;
    reasons.push(`${unscheduledCount} task(s) could not be scheduled.`);
  }

  if (warningCount > 0) {
    score -= warningCount * 5;
    reasons.push(`${warningCount} scheduling warning(s).`);
  }

  if (metrics.totalAvailableMinutes > 0) {
    const utilization = metrics.totalScheduledMinutes / metrics.totalAvailableMinutes;
    if (utilization > 0.9) {
      score -= 15;
      reasons.push('Day is highly utilized with little buffer.');
    }
  }

  if (metrics.tightTransitions > 2) {
    score -= 10;
    reasons.push('Several tight transitions between blocks.');
  }

  score = Math.max(0, Math.min(100, score));
  let level: ConfidenceLevel = 'high';
  if (score < 60) level = 'low';
  else if (score < 85) level = 'medium';

  return { level, score, reasons };
}

function generateId(prefix = ''): string {
  const base = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  return prefix ? `${prefix}-${base}` : base;
}
