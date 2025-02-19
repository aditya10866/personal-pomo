import { useMutation, useQuery } from "@tanstack/react-query";
import type { SelectPomodoroSession, SelectDailyTimeTracking } from "@db/schema";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";

export function usePomodoroSessions() {
  return useQuery<SelectPomodoroSession[]>({
    queryKey: ["/api/pomodoro-sessions"],
    staleTime: 0,
    refetchInterval: 5000,
  });
}

export function useMonthlyTimeTracking(month?: Date) {
  return useQuery<SelectDailyTimeTracking[]>({
    queryKey: ["/api/time-tracking/monthly", month?.toISOString()],
    staleTime: 0,
  });
}

export function useCreatePomodoroSession() {
  return useMutation({
    mutationFn: async (session: { taskName: string; subject: string; duration: number }) => {
      const response = await fetch("/api/pomodoro-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(session),
      });
      if (!response.ok) {
        throw new Error("Failed to create session");
      }
      return response.json();
    },
  });
}

export function getTotalDailyTime(sessions: SelectPomodoroSession[] = []): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return sessions
    .filter(session => {
      const sessionDate = new Date(session.timestamp);
      return sessionDate >= today;
    })
    .reduce((total, session) => total + session.duration, 0);
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }
  return `${minutes}m ${remainingSeconds}s`;
}

export function groupSessionsByMonth(sessions: SelectPomodoroSession[]) {
  return sessions.reduce((acc, session) => {
    const month = format(parseISO(session.timestamp), 'yyyy-MM');
    if (!acc[month]) {
      acc[month] = [];
    }
    acc[month].push(session);
    return acc;
  }, {} as Record<string, SelectPomodoroSession[]>);
}