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
    const yesterdayStr = utcDateStr(now - 86400000);

    const todayStart  = utcMidnight(todayStr);
    const todayEnd    = todayStart + 86400000 - 1;
    const yestStart   = utcMidnight(yesterdayStr);

    // ── Focus time today & yesterday ────────────────────────────────
    const logs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
        startTime: { gte: new Date(yestStart), lte: new Date(todayEnd) },
      },
    });

    let todayTime = 0;
    let yesterdayTime = 0;
    logs.forEach((log) => {
      const t = new Date(log.startTime).getTime();
      if (t >= todayStart) todayTime += (log.duration || 0);
      else yesterdayTime += (log.duration || 0);
    });
    // Convert ms → minutes to match dailyGoal unit
    const todayMins     = todayTime / 60000;
    const yesterdayMins = yesterdayTime / 60000;
    const dailyGoal     = profile.dailyGoal ?? 180; // minutes

    // ── Habits ──────────────────────────────────────────────────────
    const todos = await db.toDo.findMany({ where: { profileId: profile.id } });
    const allHabitsDone = todos.length > 0 && todos.every((t: any) => t.isCompleted);

    // A day counts toward the streak only when BOTH conditions are met
    const todayComplete = todayMins >= dailyGoal && allHabitsDone;

    // ── Streak computation ───────────────────────────────────────────
    const streakLastMs  = profile.streakLast  ? new Date(profile.streakLast).getTime()  : 0;
    const streakStartMs = profile.streakStart ? new Date(profile.streakStart).getTime() : 0;
    const streakLastStr = streakLastMs ? utcDateStr(streakLastMs) : '';

    const updateData: any = {};
    let currentStreak = 0;

    if (!streakLastStr) {
      // No streak yet — start one today if today is already complete
      if (todayComplete) {
        updateData.streakStart = new Date(todayStart);
        updateData.streakLast  = new Date(todayStart);
        currentStreak = 1;
      }
    } else if (streakLastStr === todayStr) {
      // Streak was already updated today — just count it
      const days = Math.round((utcMidnight(todayStr) - utcMidnight(utcDateStr(streakStartMs))) / 86400000);
      currentStreak = days + 1;
    } else if (streakLastStr === yesterdayStr) {
      // Last active day was yesterday — streak is still alive
      const days = Math.round((utcMidnight(yesterdayStr) - utcMidnight(utcDateStr(streakStartMs))) / 86400000);
      currentStreak = days + 1; // yesterday counted, today not yet

      if (todayComplete) {
        // Extend streak to include today
        updateData.streakLast = new Date(todayStart);
        currentStreak = days + 2;
      }
    } else {
      // Last active day was before yesterday — streak is broken, reset
      if (todayComplete) {
        updateData.streakStart = new Date(todayStart);
        updateData.streakLast  = new Date(todayStart);
        currentStreak = 1;
      } else {
        // Reset stored values so old dates don't linger
        updateData.streakStart = new Date(todayStart);
        updateData.streakLast  = new Date(todayStart);
        currentStreak = 0;
      }
    }

    // ── Best streak ─────────────────────────────────────────────────
    const bestStreak = profile.bestStreak || 0;
    if (currentStreak > bestStreak) {
      updateData.bestStreak = currentStreak;
    }

    // Persist changes if any
    if (Object.keys(updateData).length > 0) {
      await db.profile.update({ where: { id: profile.id }, data: updateData });
    }

    return NextResponse.json({
      currentStreak,
      bestStreak: Math.max(bestStreak, currentStreak),
      streakStartDate: updateData.streakStart
        ? updateData.streakStart.getTime()
        : (streakStartMs || now),
      streakLastDate: updateData.streakLast
        ? updateData.streakLast.getTime()
        : (streakLastMs || now),
      todayTime: todayMins,
      yesterdayTime: yesterdayMins,
      dailyGoal,
      allHabitsDone,
      todayHabitCount: todos.length,
      completedHabitCount: todos.filter((t: any) => t.isCompleted).length,
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