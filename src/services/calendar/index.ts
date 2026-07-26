import type { CalendarEvent, CalendarSource } from '@/src/types';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface CalendarProvider {
  requestPermissions(): Promise<{ granted: boolean; status: string }>;
  listCalendars(): Promise<CalendarSource[]>;
  importEvents(range: DateRange): Promise<CalendarEvent[]>;
  createEvent(event: Omit<CalendarEvent, 'id' | 'importedAt'>): Promise<CalendarEvent>;
  updateEvent(event: CalendarEvent): Promise<CalendarEvent>;
}

export class DeviceCalendarProvider implements CalendarProvider {
  async requestPermissions(): Promise<{ granted: boolean; status: string }> {
    return { granted: false, status: 'Device calendar provider requires a native build and expo-calendar permissions.' };
  }

  async listCalendars(): Promise<CalendarSource[]> {
    return [];
  }

  async importEvents(): Promise<CalendarEvent[]> {
    return [];
  }

  async createEvent(): Promise<CalendarEvent> {
    throw new Error('Calendar creation requires a native build and explicit permission.');
  }

  async updateEvent(): Promise<CalendarEvent> {
    throw new Error('Calendar updates require a native build and explicit permission.');
  }
}

export class LocalCalendarProvider implements CalendarProvider {
  private sources: CalendarSource[] = [
    {
      id: 'local-default',
      name: 'Local Calendar',
      type: 'local',
      enabled: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  private events: CalendarEvent[] = [];

  async requestPermissions(): Promise<{ granted: boolean; status: string }> {
    return { granted: true, status: 'Local calendar provider does not require device permissions.' };
  }

  async listCalendars(): Promise<CalendarSource[]> {
    return this.sources;
  }

  async importEvents(range: DateRange): Promise<CalendarEvent[]> {
    return this.events.filter(
      (e) => new Date(e.start) >= range.start && new Date(e.start) <= range.end,
    );
  }

  async createEvent(event: Omit<CalendarEvent, 'id' | 'importedAt'>): Promise<CalendarEvent> {
    const created: CalendarEvent = {
      ...event,
      id: `local-event-${Date.now()}`,
      importedAt: new Date().toISOString(),
    };
    this.events.push(created);
    return created;
  }

  async updateEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const idx = this.events.findIndex((e) => e.id === event.id);
    if (idx === -1) throw new Error('Event not found');
    this.events[idx] = { ...event, importedAt: new Date().toISOString() };
    return this.events[idx];
  }
}

export class MockCalendarProvider extends LocalCalendarProvider {}

export const calendarProvider = new LocalCalendarProvider();
