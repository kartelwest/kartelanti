export type EnergyLevel = 'low' | 'medium' | 'high';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'any';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'inbox' | 'planned' | 'in_progress' | 'completed' | 'deferred' | 'cancelled';
export type Context = 'computer' | 'phone' | 'errands' | 'home' | 'work' | 'creative' | 'administrative';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export const ENERGY_LEVELS: EnergyLevel[] = ['low', 'medium', 'high'];
export const TIMES_OF_DAY: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'any'];
export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent'];
export const STATUSES: TaskStatus[] = ['inbox', 'planned', 'in_progress', 'completed', 'deferred', 'cancelled'];
export const CONTEXTS: Context[] = ['computer', 'phone', 'errands', 'home', 'work', 'creative', 'administrative'];

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'weekdays' | 'weekends';
  interval?: number;
  endDate?: string;
  count?: number;
}

export interface Task {
  id: string;
  title: string;
  notes: string;
  status: TaskStatus;
  priority: Priority;
  estimatedDurationMinutes: number;
  remainingDurationMinutes: number;
  deadline?: string;
  earliestStart?: string;
  preferredTimeOfDay: TimeOfDay;
  energyRequirement: EnergyLevel;
  context: Context;
  projectOrCategory: string;
  splittable: boolean;
  minimumChunkMinutes: number;
  maximumChunkMinutes?: number;
  dependencyIds: string[];
  recurrenceRule?: RecurrenceRule;
  isFixed: boolean;
  nonNegotiable: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ScheduleBlock {
  id: string;
  taskId: string;
  title: string;
  start: string;
  end: string;
  durationMinutes: number;
  isFixed: boolean;
  locked: boolean;
  explanation: string;
  context: Context;
  energyRequirement: EnergyLevel;
  createdAt: string;
  updatedAt: string;
}

export interface FixedEvent {
  id: string;
  externalId?: string;
  calendarSourceId?: string;
  title: string;
  start: string;
  end: string;
  location?: string;
  isAllDay: boolean;
  importedAt: string;
}

export interface UserPreferences {
  id: number;
  name: string;
  wakeTime: string;
  sleepTime: string;
  workdayStart: string;
  workdayEnd: string;
  preferredFocusSessionLength: number;
  minimumBreakLength: number;
  maximumFocusedWorkHoursPerDay: number;
  morningEnergy: EnergyLevel;
  afternoonEnergy: EnergyLevel;
  eveningEnergy: EnergyLevel;
  defaultPrepBufferMinutes: number;
  defaultTravelBufferMinutes: number;
  weekStartDay: number;
  notificationsEnabled: boolean;
  morningBriefEnabled: boolean;
  eveningReviewEnabled: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DailyMetrics {
  id: number;
  date: string;
  plannedMinutes: number;
  completedMinutes: number;
  focusSessionsCompleted: number;
  reschedules: number;
  overloadWarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  plannedDurationMinutes: number;
  actualDurationMinutes?: number;
  pausedSeconds: number;
  distractions: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InboxCapture {
  id: string;
  rawInput: string;
  parsedTitle?: string;
  parsedDurationMinutes?: number;
  parsedDeadline?: string;
  parsedPreferredTimeOfDay?: TimeOfDay;
  parsedPriority?: Priority;
  parsedEnergy?: EnergyLevel;
  parsedContext?: Context;
  parsedRecurrence?: RecurrenceRule;
  confidence: number;
  confirmed: boolean;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarSource {
  id: string;
  name: string;
  type: 'device' | 'local' | 'manual';
  enabled: boolean;
  externalId?: string;
  color?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  sourceId: string;
  externalId?: string;
  title: string;
  start: string;
  end: string;
  isAllDay: boolean;
  location?: string;
  importedAt: string;
}

export interface ScheduleRun {
  id: string;
  ranAt: string;
  rangeStart: string;
  rangeEnd: string;
  blocksCreated: number;
  unscheduledTaskIds: string[];
  warnings: string[];
  explanations: string[];
  createdAt: string;
}

export interface ScheduleResult {
  blocks: ScheduleBlock[];
  unscheduledTaskIds: string[];
  warnings: string[];
  confidence: DailyConfidence;
  explanations: string[];
  metrics: ScheduleMetrics;
}

export interface DailyConfidence {
  level: ConfidenceLevel;
  score: number;
  reasons: string[];
}

export interface ScheduleMetrics {
  totalScheduledMinutes: number;
  totalAvailableMinutes: number;
  fixedEventMinutes: number;
  breakMinutes: number;
  unscheduledMinutes: number;
  tightTransitions: number;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface EnergyProfile {
  morning: EnergyLevel;
  afternoon: EnergyLevel;
  evening: EnergyLevel;
}

export interface WorkHours {
  start: string;
  end: string;
}
