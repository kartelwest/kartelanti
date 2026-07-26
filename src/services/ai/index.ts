import type { ScheduleResult } from '@/src/types';

export interface PlanningAIProvider {
  parseCapture(input: string, context: { today: Date }): Promise<{
    title?: string;
    durationMinutes?: number;
    deadline?: string;
    confidence: number;
  }>;
  summarizeDay(blocks: ScheduleResult['blocks'], date: Date): Promise<string>;
  explainSchedule(blockId: string): Promise<string>;
}

export class LocalPlanningAIProvider implements PlanningAIProvider {
  async parseCapture(input: string): Promise<{
    title?: string;
    durationMinutes?: number;
    deadline?: string;
    confidence: number;
  }> {
    const title = input.split(/(tomorrow|today|by |before |after |for \d+)/i)[0]?.trim() ?? input;
    return { title, confidence: 0.5 };
  }

  async summarizeDay(): Promise<string> {
    return 'Your day is built from fixed commitments and prioritized flexible work.';
  }

  async explainSchedule(): Promise<string> {
    return 'Scheduled based on your energy, deadlines, and available windows.';
  }
}

export class RemotePlanningAIProvider implements PlanningAIProvider {
  parseCapture(): ReturnType<PlanningAIProvider['parseCapture']> {
    throw new Error('Remote AI provider requires a secure server endpoint. Configure it in settings later.');
  }

  summarizeDay(): ReturnType<PlanningAIProvider['summarizeDay']> {
    throw new Error('Remote AI provider requires a secure server endpoint.');
  }

  explainSchedule(): ReturnType<PlanningAIProvider['explainSchedule']> {
    throw new Error('Remote AI provider requires a secure server endpoint.');
  }
}

export const aiProvider = new LocalPlanningAIProvider();
