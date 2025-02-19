import { format } from 'date-fns';
import { Habit, getWeekDates } from '../lib/habits';

interface CalendarViewProps {
  habit: Habit;
  view: string;
  onToggle: (date: Date) => void;
}

export function CalendarView({ habit, view, onToggle }: CalendarViewProps) {
  const dates = getWeekDates();

  return (
    <div className="grid grid-cols-7 gap-2 flex-1">
      {dates.map(date => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = habit.entries.find(e => e.date === dateStr);

        return (
          <button 
            key={dateStr}
            onClick={() => onToggle(date)}
            className={`text-xl transition-colors ${
              entry?.completed ? 'opacity-100' : 'opacity-30'
            } hover:opacity-70 flex items-center justify-center px-4`}
            style={{ height: '32px' }}
          >
            {habit.emoji}
          </button>
        );
      })}
    </div>
  );
}