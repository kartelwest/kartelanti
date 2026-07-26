import { LocalTaskLanguageParser } from './index';

describe('LocalTaskLanguageParser', () => {
  const parser = new LocalTaskLanguageParser();

  it('parses durations in minutes and hours', async () => {
    const result = await parser.parse('Call the insurance company for 30 minutes', { today: new Date() });
    expect(result.durationMinutes).toBe(30);
  });

  it('parses tomorrow deadline', async () => {
    const result = await parser.parse('Finish the homepage by tomorrow', { today: new Date() });
    expect(result.deadline).toBeDefined();
    expect(result.title).toBeDefined();
  });

  it('parses preferred time of day', async () => {
    const result = await parser.parse('Work out in the morning', { today: new Date() });
    expect(result.preferredTimeOfDay).toBe('morning');
  });

  it('parses priority words', async () => {
    const result = await parser.parse('Urgent: send the proposal', { today: new Date() });
    expect(result.priority).toBe('urgent');
  });

  it('parses recurrence phrases', async () => {
    const result = await parser.parse('Work out every weekday', { today: new Date() });
    expect(result.recurrence).toEqual({ frequency: 'weekdays' });
  });
});
