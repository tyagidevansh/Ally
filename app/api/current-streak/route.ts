import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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

    todayTime /= 60000;
    yesterdayTime /= 60000;

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

interface postData {
  streakStart?: number;
  streakLast?: number;
  bestStreak?: number;
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data: postData = await req.json();

    if (!data.streakLast && !data.streakStart && !data.bestStreak) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    console.log(data);

    const updateData: any = {};

    if (data.streakStart !== undefined) {
      updateData.streakStart = new Date(data.streakStart);
    }
    if (data.streakLast !== undefined) {
      updateData.streakLast = new Date(data.streakLast);
    }
    if (data.bestStreak !== undefined) {
      updateData.bestStreak = data.bestStreak;
    }

    await db.profile.update({
      where: {
        id: profile.id,
      },
      data: updateData, 
    });

    return new NextResponse("Streak updated successfully", { status: 200 });

  } catch (error) {
    console.log("Current streak post error", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}