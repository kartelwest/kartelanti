import type { Context, EnergyLevel, InboxCapture, Priority, RecurrenceRule, TimeOfDay } from '@/src/types';

export interface ParserContext {
  today: Date;
}

export interface ParsedTaskResult {
  title?: string;
  durationMinutes?: number;
  deadline?: string;
  preferredTimeOfDay?: TimeOfDay;
  priority?: Priority;
  energy?: EnergyLevel;
  context?: Context;
  recurrence?: RecurrenceRule;
  confidence: number;
  missingFields: string[];
  ambiguities: string[];
  originalInput: string;
}

export interface TaskLanguageParser {
  parse(input: string, context: ParserContext): Promise<ParsedTaskResult>;
}

export class LocalTaskLanguageParser implements TaskLanguageParser {
  async parse(input: string, context: ParserContext): Promise<ParsedTaskResult> {
    const lower = input.toLowerCase();
    const result: ParsedTaskResult = {
      confidence: 0.7,
      missingFields: [],
      ambiguities: [],
      originalInput: input,
    };

    const title = extractTitle(input);
    result.title = title;

    const duration = extractDuration(lower, input);
    if (duration) {
      result.durationMinutes = duration.minutes;
      result.confidence += 0.1;
    } else {
      result.missingFields.push('duration');
      result.ambiguities.push('No duration found; default 30 minutes suggested.');
    }

    const deadline = extractDeadline(lower, context.today);
    if (deadline) {
      result.deadline = deadline;
      result.confidence += 0.1;
    } else {
      result.missingFields.push('deadline');
    }

    const preferredTime = extractPreferredTime(lower);
    if (preferredTime) {
      result.preferredTimeOfDay = preferredTime;
    }

    const priority = extractPriority(lower);
    if (priority) {
      result.priority = priority;
    }

    const energy = extractEnergy(lower);
    if (energy) {
      result.energy = energy;
    }

    const contextName = extractContext(lower);
    if (contextName) {
      result.context = contextName;
    }

    const recurrence = extractRecurrence(lower);
    if (recurrence) {
      result.recurrence = recurrence;
    }

    if (result.confidence > 1) result.confidence = 1;

    if (!result.title) {
      result.confidence = 0.2;
      result.ambiguities.push('Could not determine a clear task title.');
    }

    return result;
  }
}

export class RemoteTaskLanguageParser implements TaskLanguageParser {
  parse(): Promise<ParsedTaskResult> {
    throw new Error('Remote parser is not enabled in V1.');
  }
}

export class MockTaskLanguageParser implements TaskLanguageParser {
  constructor(private fixed: ParsedTaskResult) {}
  async parse(): Promise<ParsedTaskResult> {
    return this.fixed;
  }
}

function extractTitle(input: string): string | undefined {
  const actionWords = ['call', 'finish', 'work out', 'remind me to', 'spend', 'do', 'write', 'review', 'send'];
  const lower = input.toLowerCase();

  for (const prefix of actionWords) {
    const idx = lower.indexOf(prefix);
    if (idx !== -1) {
      const after = input.slice(idx + prefix.length).trim();
      const cleaned = after.replace(/^(me to|on|by|before|after|for|about|the|a|an)\s+/i, '').trim();
      const deadlineIdx = findFirstDeadlineOrDurationIndex(cleaned.toLowerCase());
      const title = deadlineIdx > 0 ? cleaned.slice(0, deadlineIdx).trim() : cleaned.split(/,|\./)[0];
      return title || input;
    }
  }

  const beforeTime = input.split(/(tomorrow|today|by |before |after |,|\.|for \d+)/i)[0]?.trim();
  return beforeTime || input;
}

function findFirstDeadlineOrDurationIndex(text: string): number {
  const patterns = [
    'tomorrow', 'today', 'by ', 'before ', 'after ', 'for ',
    '\d+\s*(min|minute|minutes|hr|hour|hours|h)',
    'morning', 'afternoon', 'evening',
    'every ', 'three times', 'twice', 'daily', 'weekly', 'weekdays', 'weekends',
  ];
  let min = -1;
  for (const p of patterns) {
    const re = new RegExp(p, 'i');
    const m = text.match(re);
    if (m && m.index !== undefined && (min === -1 || m.index < min)) {
      min = m.index;
    }
  }
  return min;
}

function extractDuration(lower: string, original: string): { minutes: number } | null {
  const patterns = [
    { re: /(?:for |about |~)?(\d+)\s*(min|minute|minutes)\b/i, unit: 1 },
    { re: /(?:for |about |~)?(\d+)\s*(hr|hour|hours|h)\b/i, unit: 60 },
    { re: /(?:for |about |~)?(\d+\.?\d*)\s*(hr|hour|hours|h)\b/i, unit: 60 },
  ];

  for (const { re, unit } of patterns) {
    const m = lower.match(re);
    if (m && m[1]) {
      const value = parseFloat(m[1]);
      if (!Number.isNaN(value)) {
        return { minutes: Math.round(value * unit) };
      }
    }
  }

  const wordMap: Record<string, number> = {
    'half an hour': 30,
    'an hour': 60,
    'one hour': 60,
    'two hours': 120,
    'three hours': 180,
    'ninety minutes': 90,
    'forty five minutes': 45,
    '45 minutes': 45,
    'thirty minutes': 30,
  };

  for (const [phrase, minutes] of Object.entries(wordMap)) {
    if (lower.includes(phrase)) return { minutes };
  }

  return null;
}

function extractDeadline(lower: string, today: Date): string | undefined {
  const reference = new Date(today);
  reference.setHours(0, 0, 0, 0);

  if (lower.includes('today')) {
    reference.setHours(23, 59, 0, 0);
    return reference.toISOString();
  }
  if (lower.includes('tomorrow')) {
    reference.setDate(reference.getDate() + 1);
    reference.setHours(23, 59, 0, 0);
    return reference.toISOString();
  }

  const dayMatch = lower.match(/(?:by|before|on)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (dayMatch && dayMatch[1]) {
    const target = nextDay(reference, dayMatch[1]);
    target.setHours(23, 59, 0, 0);
    return target.toISOString();
  }

  const dateMatch = lower.match(/(?:by|before|on)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i);
  if (dateMatch && dateMatch[1] && dateMatch[2]) {
    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const year = dateMatch[3] ? parseInt(dateMatch[3], 10) : reference.getFullYear();
    const fullYear = year < 100 ? 2000 + year : year;
    const d = new Date(fullYear, month, day, 23, 59, 0, 0);
    return d.toISOString();
  }

  if (lower.includes('this week')) {
    const end = new Date(reference);
    end.setDate(reference.getDate() + (6 - reference.getDay()));
    end.setHours(23, 59, 0, 0);
    return end.toISOString();
  }

  return undefined;
}

function nextDay(reference: Date, dayName: string): Date {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const target = days.indexOf(dayName.toLowerCase());
  const current = reference.getDay();
  const diff = (target - current + 7) % 7;
  const d = new Date(reference);
  d.setDate(reference.getDate() + (diff === 0 ? 7 : diff));
  return d;
}

function extractPreferredTime(lower: string): TimeOfDay | undefined {
  if (lower.includes('morning')) return 'morning';
  if (lower.includes('afternoon')) return 'afternoon';
  if (lower.includes('evening')) return 'evening';
  return undefined;
}

function extractPriority(lower: string): Priority | undefined {
  if (lower.includes('urgent') || lower.includes('asap')) return 'urgent';
  if (lower.includes('important') || lower.includes('high priority')) return 'high';
  if (lower.includes('low priority') || lower.includes('whenever')) return 'low';
  return undefined;
}

function extractEnergy(lower: string): EnergyLevel | undefined {
  if (lower.includes('high energy') || lower.includes('hard') || lower.includes('deep work')) return 'high';
  if (lower.includes('low energy') || lower.includes('easy') || lower.includes('mindless')) return 'low';
  if (lower.includes('medium energy')) return 'medium';
  return undefined;
}

function extractContext(lower: string): Context | undefined {
  const contextKeywords: Record<Context, string[]> = {
    computer: ['computer', 'laptop', 'desktop', 'email', 'code', 'design'],
    phone: ['phone', 'call', 'text'],
    errands: ['errand', 'store', 'grocery', 'pickup', 'drop off'],
    home: ['home', 'clean', 'laundry', 'dishes'],
    work: ['work', 'meeting', 'client', 'boss'],
    creative: ['creative', 'write', 'paint', 'design', 'draft'],
    administrative: ['admin', 'paperwork', 'tax', 'insurance', 'bill'],
  };

  for (const [ctx, keywords] of Object.entries(contextKeywords)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return ctx as Context;
    }
  }
  return undefined;
}

function extractRecurrence(lower: string): RecurrenceRule | undefined {
  if (lower.includes('every day') || lower.includes('daily')) return { frequency: 'daily' };
  if (lower.includes('every weekday')) return { frequency: 'weekdays' };
  if (lower.includes('every weekend')) return { frequency: 'weekends' };
  if (lower.match(/three times this week/i)) return { frequency: 'weekly', count: 3 };
  if (lower.match(/twice a week/i)) return { frequency: 'weekly', count: 2 };
  if (lower.includes('every week') || lower.includes('weekly')) return { frequency: 'weekly' };
  if (lower.includes('every month') || lower.includes('monthly')) return { frequency: 'monthly' };
  return undefined;
}

export function parsedResultToInboxCapture(input: string, parsed: ParsedTaskResult): InboxCapture {
  return {
    id: `capture-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    rawInput: input,
    parsedTitle: parsed.title,
    parsedDurationMinutes: parsed.durationMinutes,
    parsedDeadline: parsed.deadline,
    parsedPreferredTimeOfDay: parsed.preferredTimeOfDay,
    parsedPriority: parsed.priority,
    parsedEnergy: parsed.energy,
    parsedContext: parsed.context,
    parsedRecurrence: parsed.recurrence,
    confidence: parsed.confidence,
    confirmed: false,
    status: 'inbox',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
