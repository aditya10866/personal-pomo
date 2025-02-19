import { pgTable, text, serial, integer, boolean, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
});

export const pomodoroSessions = pgTable("pomodoro_sessions", {
  id: serial("id").primaryKey(),
  taskName: text("task_name").notNull(),
  subject: text("subject").notNull(),
  duration: integer("duration").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const dailyTimeTracking = pgTable("daily_time_tracking", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  totalDuration: integer("total_duration").notNull(),
  subject: text("subject").notNull(),
});

// Schema validation
export const insertPomodoroSessionSchema = createInsertSchema(pomodoroSessions);
export const selectPomodoroSessionSchema = createSelectSchema(pomodoroSessions);
export const insertDailyTimeTrackingSchema = createInsertSchema(dailyTimeTracking);
export const selectDailyTimeTrackingSchema = createSelectSchema(dailyTimeTracking);

// Types
export type InsertPomodoroSession = typeof pomodoroSessions.$inferInsert;
export type SelectPomodoroSession = typeof pomodoroSessions.$inferSelect;
export type InsertDailyTimeTracking = typeof dailyTimeTracking.$inferInsert;
export type SelectDailyTimeTracking = typeof dailyTimeTracking.$inferSelect;

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const habitEntries = pgTable("habit_entries", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").references(() => habits.id, { onDelete: "cascade" }).notNull(),
  date: date("date").notNull(),
  completed: boolean("completed").notNull().default(false),
});

export const habitsRelations = relations(habits, ({ many }) => ({
  entries: many(habitEntries),
}));

export const habitEntriesRelations = relations(habitEntries, ({ one }) => ({
  habit: one(habits, {
    fields: [habitEntries.habitId],
    references: [habits.id],
  }),
}));

// Schema validation for habits
export const insertHabitSchema = createInsertSchema(habits);
export const selectHabitSchema = createSelectSchema(habits);
export const insertHabitEntrySchema = createInsertSchema(habitEntries);
export const selectHabitEntrySchema = createSelectSchema(habitEntries);

// Types for habits
export type InsertHabit = typeof habits.$inferInsert;
export type SelectHabit = typeof habits.$inferSelect;
export type InsertHabitEntry = typeof habitEntries.$inferInsert;
export type SelectHabitEntry = typeof habitEntries.$inferSelect;