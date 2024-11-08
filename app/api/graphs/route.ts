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

    const url = new URL(req.url);
    const startTimeString = url.searchParams.get("startTime");
    const endTimeString = url.searchParams.get("endTime");
    const byMonth = url.searchParams.get("byMonth") === "true";

    if (!startTimeString || !endTimeString) {
      return new NextResponse("Invalid date range", { status: 400 });
    }

    const startTime = new Date(startTimeString);
    const endTime = new Date(endTimeString);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return new NextResponse("Invalid date format", { status: 400 });
    }

    const activities = ["Study", "Reading", "Coding", "Meditation", "Other"];

    const logs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
        startTime: {
          gte: startTime,
          lt: new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate() + 1)),
        },
      },
    });

    const chartData = [];

    if (byMonth) {
      const monthMap: { [key: string]: { [key: string]: number } } = {};

      logs.forEach((log) => {
        const month = log.startTime.toLocaleString('default', { month: "short", year: "numeric", timeZone: "UTC" });

        if (!monthMap[month]) {
          monthMap[month] = {};
          activities.forEach((activity) => {
            monthMap[month][activity] = 0;
          });
        }

        monthMap[month][log.activity] += log.duration;
      });

      for (let dt = new Date(startTime); dt <= endTime; dt.setUTCMonth(dt.getUTCMonth() + 1)) {
        const month = dt.toLocaleString('default', { month: "short", year: "numeric", timeZone: "UTC" });

        const activityTimes: { [key: string]: number } = {};
        let totalTime = 0;

        activities.forEach((activity) => {
          const time = monthMap[month]?.[activity] || 0;
          activityTimes[activity] = time;
          totalTime += time;
        });

        chartData.push({
          date: month.slice(0, 3),
          ...activityTimes,
          totalTime,
          dailyGoal: profile.dailyGoal,
        });
      }
    } else {
      const dateMap: { [key: string]: { [key: string]: number } } = {};

      logs.forEach((log) => {
        const date = log.startTime.toUTCString().slice(5, 11); // MMM DD in UTC
        if (!dateMap[date]) {
          dateMap[date] = {};
          activities.forEach((activity) => {
            dateMap[date][activity] = 0;
          });
        }
        dateMap[date][log.activity] += log.duration;
      });

      for (let dt = new Date(startTime); dt <= endTime; dt.setUTCDate(dt.getUTCDate() + 1)) {
        const date = dt.toUTCString().slice(5, 11); // MMM DD in UTC
        const activityTimes: { [key: string]: number } = {};
        let totalTime = 0;

        activities.forEach((activity) => {
          const time = dateMap[date]?.[activity] || 0;
          activityTimes[activity] = time;
          totalTime += time;
        });
        chartData.push({
          date,
          ...activityTimes,
          totalTime,
          dailyGoal: profile.dailyGoal,
        });
      }
    }

    return NextResponse.json({ success: "message received", chartData });
  } catch (error) {
    console.log("[GRAPHS ERROR] ", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { goal }: { goal: number } = await req.json();

    if (!goal) {
      return new NextResponse("Empty request", { status: 400 });
    }

    // Update the profile with the new goal
    await db.profile.update({
      where: { id: profile.id },
      data: {
        dailyGoal: goal,
      },
    });

    return new NextResponse(JSON.stringify({ message: "Goal updated successfully" }), { status: 200 });
  } catch (error) {
    console.log("daily goal post error ", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
