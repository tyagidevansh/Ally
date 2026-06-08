import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

/** Returns the UTC date string "YYYY-MM-DD" for a timestamp */
function utcDateStr(ts: number | Date): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** UTC midnight (ms) for a given date string "YYYY-MM-DD" */
function utcMidnight(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00.000Z').getTime();
}

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    const now = Date.now();
    const todayStr = utcDateStr(now);
    const todayStart = utcMidnight(todayStr);
    const dailyGoal = profile.dailyGoal ?? 180; // minutes
    const dailyGoalMs = dailyGoal * 60000;

    // ── Habits (for UI indicators, not streak) ──────────────────────
    const todos = await db.toDo.findMany({ where: { profileId: profile.id } });
    const allHabitsDone = todos.length > 0 && todos.every((t: any) => t.isCompleted);
    const todayHabitCount = todos.length;
    const completedHabitCount = todos.filter((t: any) => t.isCompleted).length;

    // ── Fetch all logs in a reasonable window ────────────────────────
    // We look back up to 365 days (no one has a streak longer than that
    // in this app). A single bulk query is much faster than per-day queries.
    const lookbackDays = 365;
    const lookbackStart = todayStart - lookbackDays * 86400000;

    const logs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
        startTime: {
          gte: new Date(lookbackStart),
          lt: new Date(todayStart + 86400000),
        },
      },
      select: { startTime: true, duration: true },
    });

    // ── Bucket logs by UTC date ─────────────────────────────────────
    const dayTotals = new Map<string, number>();
    for (const log of logs) {
      const dateKey = utcDateStr(log.startTime);
      dayTotals.set(dateKey, (dayTotals.get(dateKey) || 0) + (log.duration || 0));
    }

    // ── Compute streak by walking backwards ─────────────────────────
    // A day counts toward the streak if total logged time >= dailyGoal.
    // The streak is purely derived from persisted timer-log data, so it
    // works correctly regardless of when the user opens the dashboard.
    // Todos are NOT considered — they reset daily and their state is
    // ephemeral, so they can't be evaluated retroactively.

    let streak = 0;
    let todayComplete = false;
    let checkMs = todayStart;

    // Check today first
    const todayTotal = dayTotals.get(todayStr) || 0;
    if (todayTotal >= dailyGoalMs) {
      todayComplete = true;
      streak = 1;
      checkMs -= 86400000; // move to yesterday
    } else {
      // Today isn't complete yet — check if yesterday was the last
      // completed day (streak is still alive, just not extended today)
      checkMs -= 86400000;
      const yesterdayStr = utcDateStr(checkMs);
      const yesterdayTotal = dayTotals.get(yesterdayStr) || 0;
      if (yesterdayTotal < dailyGoalMs) {
        // Neither today nor yesterday complete — streak is 0
        const updateData: any = {
          streakStart: null,
          streakLast: null,
        };
        await db.profile.update({ where: { id: profile.id }, data: updateData });

        return NextResponse.json({
          currentStreak: 0,
          bestStreak: profile.bestStreak || 0,
          streakStartDate: now,
          streakLastDate: now,
          todayTime: todayTotal / 60000,
          dailyGoal,
          allHabitsDone,
          todayHabitCount,
          completedHabitCount,
        });
      }
      // Yesterday was complete, start counting from yesterday
      streak = 1;
      checkMs -= 86400000; // move to day before yesterday
    }

    // Walk further back, counting consecutive completed days
    while (checkMs >= lookbackStart) {
      const dateKey = utcDateStr(checkMs);
      const total = dayTotals.get(dateKey) || 0;
      if (total < dailyGoalMs) break;
      streak++;
      checkMs -= 86400000;
    }

    // The streak starts on the day after the last incomplete day
    const streakStartDate = checkMs + 86400000;
    const streakLastDate = todayComplete ? todayStart : todayStart - 86400000;

    // ── Persist streak metadata & best streak ───────────────────────
    const bestStreak = profile.bestStreak || 0;
    const updateData: any = {
      streakStart: new Date(streakStartDate),
      streakLast: new Date(streakLastDate),
    };
    if (streak > bestStreak) {
      updateData.bestStreak = streak;
    }

    await db.profile.update({ where: { id: profile.id }, data: updateData });

    return NextResponse.json({
      currentStreak: streak,
      bestStreak: Math.max(bestStreak, streak),
      streakStartDate,
      streakLastDate,
      todayTime: todayTotal / 60000,
      dailyGoal,
      allHabitsDone,
      todayHabitCount,
      completedHabitCount,
    });

  } catch (error) {
    console.log("[CURRENT STREAK ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

// POST remains for any legacy callers but streak logic now lives in GET
export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    const data = await req.json();
    const updateData: any = {};
    if (data.streakStart !== undefined) updateData.streakStart = new Date(data.streakStart);
    if (data.streakLast  !== undefined) updateData.streakLast  = new Date(data.streakLast);
    if (data.bestStreak  !== undefined) updateData.bestStreak  = data.bestStreak;

    if (Object.keys(updateData).length === 0) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    await db.profile.update({ where: { id: profile.id }, data: updateData });
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.log("[STREAK POST ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}