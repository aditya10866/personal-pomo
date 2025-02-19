import { useState } from 'react';
import { format } from 'date-fns';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarView } from './calendar-view';
import { Habit, useToggleHabit } from '../lib/habits';
import { Pencil, Save, Trash2 } from 'lucide-react';

interface HabitRowProps {
  habit: Habit;
  view: string;
  onUpdate: (habit: Habit) => void;
  onDelete: () => void;
}

export default function HabitRow({ habit, view, onUpdate, onDelete }: HabitRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(habit.name);
  const toggleHabit = useToggleHabit();

  const handleToggle = (date: Date) => {
    toggleHabit.mutate({ habitId: habit.id, date });
  };

  const handleSave = () => {
    if (editedName.trim()) {
      onUpdate({ ...habit, name: editedName });
      setIsEditing(false);
    }
  };

  return (
    <div className="grid grid-cols-[8rem_1fr] gap-4 items-center group relative">
      <div className="flex items-center pl-2">
        {isEditing ? (
          <Input
            value={editedName}
            onChange={e => setEditedName(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSave()}
            className="flex-1 h-8"
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xl w-10 flex justify-center">{habit.emoji}</span>
            <span className="font-medium truncate">{habit.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center relative">
        <CalendarView
          habit={habit}
          view={view}
          onToggle={handleToggle}
        />

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -right-20 top-0">
          {isEditing ? (
            <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0">
              <Save className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)} className="h-8 w-8 p-0">
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={onDelete}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}