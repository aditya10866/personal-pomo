import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import { usePomodoroSessions, useCreatePomodoroSession, formatDuration, getTotalDailyTime, groupSessionsByMonth } from '../lib/pomodoro';
import { format } from 'date-fns';

const SUBJECTS = ["PE", "English", "Chemistry", "Maths", "Physics"] as const;

export default function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [currentTask, setCurrentTask] = useState('');
  const [currentSubject, setCurrentSubject] = useState<string>(SUBJECTS[0]);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [workMinutes, setWorkMinutes] = useState(25);

  const { data: sessions = [], refetch } = usePomodoroSessions();
  const createSession = useCreatePomodoroSession();

  const totalSeconds = workMinutes * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  const toggleTimer = () => {
    if (!isRunning && !currentTask.trim()) {
      return;
    }

    setIsRunning(prev => {
      if (!prev) {
        setSessionStartTime(new Date());
      }
      return !prev;
    });
  };

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(workMinutes * 60);
    setSessionStartTime(null);
  }, [workMinutes]);

  const completeSession = useCallback(() => {
    if (sessionStartTime) {
      const sessionDuration = Math.round((new Date().getTime() - sessionStartTime.getTime()) / 1000);
      createSession.mutate({
        taskName: currentTask,
        subject: currentSubject,
        duration: sessionDuration,
      }, {
        onSuccess: () => {
          refetch();
        }
      });
    }

    setIsRunning(false);
    setTimeLeft(workMinutes * 60);
    setCurrentTask('');
    setSessionStartTime(null);
  }, [sessionStartTime, currentTask, currentSubject, workMinutes, createSession, refetch]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      completeSession();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, completeSession]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleTimerSettingsChange = useCallback((value: string) => {
    const numValue = parseInt(value) || 0;
    setWorkMinutes(numValue);
    if (!isRunning) {
      setTimeLeft(numValue * 60);
    }
  }, [isRunning]);

  const totalDailyTime = getTotalDailyTime(sessions);
  const sessionsByMonth = groupSessionsByMonth(sessions);

  return (
    <div className="space-y-6 border rounded-lg shadow-sm p-6 font-sans bg-purple-950/50 text-purple-50 border-purple-800/50">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-medium">Daily Progress</h2>
          <div className="text-right">
            <div className="text-sm text-purple-300">Total Time Today</div>
            <div className="text-2xl font-medium">{formatDuration(totalDailyTime)}</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="What are you working on?"
            value={currentTask}
            onChange={e => setCurrentTask(e.target.value)}
            disabled={isRunning}
            className="max-w-sm bg-purple-900/50 border-purple-700"
          />
          <Select 
            value={currentSubject} 
            onValueChange={setCurrentSubject}
            disabled={isRunning}
          >
            <SelectTrigger className="w-[180px] bg-purple-900/50 border-purple-700">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent className="bg-purple-900 border-purple-700">
              {SUBJECTS.map(subject => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-purple-300">Session Length (minutes)</label>
          <Input
            type="number"
            min="1"
            value={workMinutes}
            onChange={e => handleTimerSettingsChange(e.target.value)}
            disabled={isRunning}
            className="max-w-[200px] bg-purple-900/50 border-purple-700"
          />
        </div>

        <div className="p-6 border rounded-lg border-purple-800/50 bg-purple-900/30 max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Focus Time 🎯</h2>
          </div>

          <div className="space-y-4">
            <div className="text-4xl font-light text-center tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>

            <Progress value={progress} className="h-2" />

            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTimer}
                className="w-10 h-10 bg-purple-900/50 border-purple-700 hover:bg-purple-800/50"
                disabled={!currentTask.trim() && !isRunning}
              >
                {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={resetTimer}
                className="w-10 h-10 bg-purple-900/50 border-purple-700 hover:bg-purple-800/50"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={completeSession}
                className="w-10 h-10 bg-purple-900/50 border-purple-700 hover:bg-purple-800/50"
                disabled={!sessionStartTime}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {Object.keys(sessionsByMonth).length > 0 && (
        <Accordion type="single" collapsible className="w-full space-y-2">
          {Object.entries(sessionsByMonth)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([month, monthSessions]) => {
              const totalMonthlyTime = monthSessions.reduce((acc, session) => acc + session.duration, 0);

              return (
                <AccordionItem 
                  key={month} 
                  value={month}
                  className="border border-purple-800/30 rounded-lg overflow-hidden bg-purple-900/30 px-2"
                >
                  <AccordionTrigger className="text-lg py-4 hover:no-underline hover:bg-purple-900/20">
                    <div className="flex justify-between w-full pr-4">
                      <span>{format(new Date(month), 'MMMM yyyy')}</span>
                      <span className="text-purple-300">{formatDuration(totalMonthlyTime)}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 py-2">
                      {monthSessions.map((session) => (
                        <div 
                          key={session.id}
                          className="flex justify-between items-center p-3 bg-purple-900/30 rounded-lg border border-purple-800/30"
                        >
                          <div>
                            <span className="font-medium">{session.taskName}</span>
                            <span className="text-sm text-purple-300 ml-2">({session.subject})</span>
                          </div>
                          <span className="text-sm text-purple-200">
                            {formatDuration(session.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
          })}
        </Accordion>
      )}
    </div>
  );
}