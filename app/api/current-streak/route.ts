import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(todayStart.getDate() - 1); 

    const logs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
        startTime: {
          gte: yesterdayStart,
          lt: now,
        },
      },
    });

    let todayTime = 0;
    let yesterdayTime = 0;

    logs.forEach((log) => {
      const logDate = new Date(log.startTime).getTime();
      const logDuration = log.duration || 0;

      if (logDate >= todayStart.getTime()) {
        todayTime += logDuration;
      } else {
        yesterdayTime += logDuration;
      }
    });

    return NextResponse.json({
      streakStartDate: profile.streakStart || Date.now(),
      streakLastDate: profile.streakLast || Date.now(),
      bestStreak: profile.bestStreak || 0,
      todayTime,
      yesterdayTime,
      dailyGoal: profile.dailyGoal,
    });

  } catch (error) {
    console.log("[CURRENT STREAK ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
