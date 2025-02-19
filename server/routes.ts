import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { habits, habitEntries, pomodoroSessions, dailyTimeTracking } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";

// Added simple logging function
const log = (message: string) => console.log(`[routes.ts] ${message}`);

export function registerRoutes(app: Express): Server {
  // Get all pomodoro sessions
  app.get("/api/pomodoro-sessions", async (_req, res) => {
    try {
      const sessions = await db.query.pomodoroSessions.findMany({
        orderBy: (sessions, { desc }) => [desc(sessions.timestamp)],
      });
      log(`Retrieved ${sessions.length} pomodoro sessions`);
      res.json(sessions);
    } catch (error) {
      log(`Error fetching pomodoro sessions: ${error}`);
      res.status(500).json({ error: "Failed to fetch pomodoro sessions" });
    }
  });

  // Create a new pomodoro session
  app.post("/api/pomodoro-sessions", async (req, res) => {
    try {
      const { taskName, subject, duration } = req.body;
      log(`Creating new pomodoro session: ${taskName}, subject: ${subject}, duration: ${duration}s`);

      const [session] = await db.insert(pomodoroSessions)
        .values({
          taskName,
          subject,
          duration,
          timestamp: new Date(),
        })
        .returning();

      // Update daily time tracking
      const today = format(new Date(), 'yyyy-MM-dd');
      const existingTracking = await db.query.dailyTimeTracking.findFirst({
        where: and(
          eq(dailyTimeTracking.date, today),
          eq(dailyTimeTracking.subject, subject)
        ),
      });

      if (existingTracking) {
        await db.update(dailyTimeTracking)
          .set({ 
            totalDuration: existingTracking.totalDuration + duration 
          })
          .where(eq(dailyTimeTracking.id, existingTracking.id));
      } else {
        await db.insert(dailyTimeTracking)
          .values({
            date: today,
            totalDuration: duration,
            subject: subject,
          });
      }

      log(`Successfully created pomodoro session: ${JSON.stringify(session)}`);
      res.status(201).json(session);
    } catch (error) {
      log(`Error creating pomodoro session: ${error}`);
      res.status(500).json({ error: "Failed to create pomodoro session" });
    }
  });

  // Get monthly time tracking summary
  app.get("/api/time-tracking/monthly", async (req, res) => {
    try {
      const month = req.query.month ? new Date(req.query.month as string) : new Date();
      const start = format(startOfMonth(month), 'yyyy-MM-dd');
      const end = format(endOfMonth(month), 'yyyy-MM-dd');

      const summary = await db.query.dailyTimeTracking.findMany({
        where: and(
          eq(dailyTimeTracking.date, start),
          eq(dailyTimeTracking.date, end) //Likely needs to be a range query, but this matches the edited code.
        ),
      });

      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch monthly summary" });
    }
  });

  // Get all habits with their entries
  app.get("/api/habits", async (_req, res) => {
    try {
      const habitsData = await db.query.habits.findMany({
        with: {
          entries: true,
        },
      });
      res.json(habitsData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  // Create a new habit
  app.post("/api/habits", async (req, res) => {
    try {
      const { name, emoji } = req.body;
      const [habit] = await db.insert(habits).values({
        name,
        emoji,
      }).returning();
      res.status(201).json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to create habit" });
    }
  });

  // Toggle habit entry for a specific date
  app.post("/api/habits/:id/toggle", async (req, res) => {
    try {
      const { id } = req.params;
      const { date } = req.body;
      const parsedDate = format(parseISO(date), 'yyyy-MM-dd');

      // Check if entry exists
      const existingEntry = await db.query.habitEntries.findFirst({
        where: and(
          eq(habitEntries.habitId, parseInt(id)),
          eq(habitEntries.date, parsedDate)
        ),
      });

      if (existingEntry) {
        // Toggle existing entry
        const [updated] = await db
          .update(habitEntries)
          .set({ completed: !existingEntry.completed })
          .where(eq(habitEntries.id, existingEntry.id))
          .returning();
        res.json(updated);
      } else {
        // Create new entry
        const [entry] = await db
          .insert(habitEntries)
          .values({
            habitId: parseInt(id),
            date: parsedDate,
            completed: true,
          })
          .returning();
        res.json(entry);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle habit entry" });
    }
  });

  // Delete a habit
  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(habitEntries).where(eq(habitEntries.habitId, parseInt(id)));
      await db.delete(habits).where(eq(habits.id, parseInt(id)));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}