import {
  addDays,
  addMinutes,
  differenceInMinutes,
  format,
  getHours,
  isAfter,
  isBefore,
  isSameDay,
  parseISO,
  setHours,
  setMinutes,
  startOfDay,
  startOfWeek,
} from 'date-fns';

export { addDays, addMinutes, differenceInMinutes, format, isAfter, isBefore, isSameDay, parseISO, startOfDay, startOfWeek };

export function toISO(date: Date): string {
  return date.toISOString();
}

export function fromISO(iso: string): Date {
  return parseISO(iso);
}

export function timeStringToMinutes(time: string): number {
  const [hStr, mStr] = time.split(':');
  const hours = hStr ? parseInt(hStr, 10) : 0;
  const minutes = mStr ? parseInt(mStr, 10) : 0;
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.round(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function applyTime(date: Date, time: string): Date {
  const [hStr, mStr] = time.split(':');
  const hours = hStr ? parseInt(hStr, 10) : 0;
  const minutes = mStr ? parseInt(mStr, 10) : 0;
  return setMinutes(setHours(startOfDay(date), hours), minutes);
}

export function segmentOfDay(date: Date): 'morning' | 'afternoon' | 'evening' {
  const h = getHours(date);
  if (h < 12) return 'morning';
  if (h < 18) return 'afternoon';
  return 'evening';
}

export function friendlyDate(date: Date): string {
  const today = startOfDay(new Date());
  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, addDays(today, 1))) return 'Tomorrow';
  return format(date, 'EEEE, MMM d');
}

export function friendlyTime(date: Date): string {
  return format(date, 'h:mm a');
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return isBefore(aStart, bEnd) && isAfter(aEnd, bStart);
}

export interface TimeInterval {
  start: Date;
  end: Date;
}

export function mergeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: TimeInterval[] = [];
  for (const interval of sorted) {
    const last = merged[merged.length - 1];
    if (!last || isAfter(interval.start, last.end)) {
      merged.push(interval);
    } else if (isAfter(interval.end, last.end)) {
      last.end = interval.end;
    }
  }
  return merged;
}

export function intervalsOverlap(a: TimeInterval, b: TimeInterval): boolean {
  return a.start < b.end && a.end > b.start;
}
