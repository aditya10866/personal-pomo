import { addDays, format, startOfWeek, isSameDay } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './queryClient';

export interface HabitEntry {
  id: number;
  habitId: number;
  date: string;
  completed: boolean;
}

export interface Habit {
  id: number;
  name: string;
  emoji: string;
  entries: HabitEntry[];
  createdAt: string;
}

export function getStreak(entries: HabitEntry[]): number {
  let streak = 0;
  const today = new Date();
  let currentDate = today;

  while (true) {
    const entry = entries.find(e => 
      isSameDay(new Date(e.date), currentDate)
    );

    if (!entry?.completed) break;
    streak++;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

export function getWeekDates(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function useHabits() {
  return useQuery<Habit[]>({
    queryKey: ['/api/habits'],
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habit: { name: string; emoji: string }) => {
      const res = await apiRequest('POST', '/api/habits', habit);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
    },
  });
}

export function useToggleHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: number; date: Date }) => {
      const res = await apiRequest('POST', `/api/habits/${habitId}/toggle`, {
        date: format(date, 'yyyy-MM-dd'),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (habitId: number) => {
      await apiRequest('DELETE', `/api/habits/${habitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/habits'] });
    },
  });
}