import { useQuery } from '@tanstack/react-query';
import { scheduleBlocksRepo, tasksRepo, userPreferencesRepo } from '@/src/database/repositories';
import { buildSchedule } from '@/src/services/scheduler/engine';
import type { ScheduleResult, UserPreferences } from '@/src/types';
import { addDays, startOfDay } from '@/src/utils/date';

export function useSchedule(date: Date) {
  const { data: result, isLoading: loading, refetch } = useQuery<ScheduleResult>({
    queryKey: ['schedule', date.toISOString()],
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: async () => {
      const [tasks, prefs] = await Promise.all([tasksRepo.getActive(), userPreferencesRepo.get()]);
      const defaultPrefs: UserPreferences = {
        id: 1,
        name: '',
        wakeTime: '07:00',
        sleepTime: '23:00',
        workdayStart: '09:00',
        workdayEnd: '17:00',
        preferredFocusSessionLength: 50,
        minimumBreakLength: 10,
        maximumFocusedWorkHoursPerDay: 6,
        morningEnergy: 'high',
        afternoonEnergy: 'medium',
        eveningEnergy: 'low',
        defaultPrepBufferMinutes: 15,
        defaultTravelBufferMinutes: 0,
        weekStartDay: 0,
        notificationsEnabled: true,
        morningBriefEnabled: true,
        eveningReviewEnabled: true,
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const p = prefs ?? defaultPrefs;

      const rangeStart = startOfDay(date);
      const rangeEnd = addDays(rangeStart, 1);

      const schedule = buildSchedule({
        rangeStart,
        rangeEnd,
        now: new Date(),
        tasks,
        fixedEvents: [],
        availability: { start: p.workdayStart, end: p.workdayEnd },
        energyProfile: { morning: p.morningEnergy, afternoon: p.afternoonEnergy, evening: p.eveningEnergy },
        breakRules: { minimumBreakMinutes: p.minimumBreakLength, focusSessionMinutes: p.preferredFocusSessionLength, longBreakMinutes: p.minimumBreakLength * 2 },
        prepBufferMinutes: p.defaultPrepBufferMinutes,
        travelBufferMinutes: p.defaultTravelBufferMinutes,
        dailyFocusMaxMinutes: p.maximumFocusedWorkHoursPerDay * 60,
      });

      await scheduleBlocksRepo.deleteForDate(date);
      for (const block of schedule.blocks) {
        await scheduleBlocksRepo.save(block);
      }

      return schedule;
    },
  });

  return {
    blocks: result?.blocks ?? [],
    confidence: result?.confidence ?? null,
    result,
    loading,
    rebuild: refetch,
  };
}
