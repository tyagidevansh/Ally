import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Disable caching but allow stale-while-revalidate

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
      orderBy: {
        startTime: 'asc',
      },
    });

    const chartData = [];
    const currentYear = new Date().getUTCFullYear();
    const spansMultipleYears = startTime.getUTCFullYear() !== endTime.getUTCFullYear();

    if (byMonth) {
      const monthMap: { [key: string]: { [key: string]: number } } = {};

      // Pre-process logs into map using UTC
      logs.forEach((log) => {
        const year = log.startTime.getUTCFullYear();
        const month = log.startTime.getUTCMonth();
        const key = `${year}-${String(month).padStart(2, '0')}`; // e.g., "2025-01"

        if (!monthMap[key]) {
          monthMap[key] = {};
          activities.forEach((activity) => {
            monthMap[key][activity] = 0;
          });
        }

        monthMap[key][log.activity] += log.duration;
      });

      // Generate chart data - iterate through all months in range
      let currentDate = new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), 1));
      const endDate = new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), 1));

      while (currentDate <= endDate) {
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth();
        const key = `${year}-${String(month).padStart(2, '0')}`;
        
        // Format display name - always show just the month name
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const displayMonth = monthNames[month];

        const activityTimes: { [key: string]: number } = {};
        let totalTime = 0;

        activities.forEach((activity) => {
          const time = monthMap[key]?.[activity] || 0;
          activityTimes[activity] = time;
          totalTime += time;
        });

        chartData.push({
          date: displayMonth,
          ...activityTimes,
          totalTime,
          dailyGoal: profile.dailyGoal,
        });

        // Move to next month
        currentDate = new Date(Date.UTC(year, month + 1, 1));
      }
    } else {
      const dateMap: { [key: string]: { [key: string]: number } } = {};

      // Pre-process logs into map with UTC dates
      logs.forEach((log) => {
        const year = log.startTime.getUTCFullYear();
        const month = log.startTime.getUTCMonth();
        const day = log.startTime.getUTCDate();
        const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; // e.g., "2025-01-15"
        
        if (!dateMap[key]) {
          dateMap[key] = {};
          activities.forEach((activity) => {
            dateMap[key][activity] = 0;
          });
        }
        dateMap[key][log.activity] += log.duration;
      });

      // Generate chart data with weekly average
      let weeklyTimes: number[] = [];
      let weeklyTotal = 0;

      // Iterate through each day in the range using UTC
      let currentDate = new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate()));
      const endDate = new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate()));

      while (currentDate <= endDate) {
        const year = currentDate.getUTCFullYear();
        const month = currentDate.getUTCMonth();
        const day = currentDate.getUTCDate();
        const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Format display date - always show just month and day
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const displayDate = `${monthNames[month]} ${String(day).padStart(2, '0')}`;
        
        const activityTimes: { [key: string]: number } = {};
        let totalTime = 0;

        activities.forEach((activity) => {
          const time = dateMap[key]?.[activity] || 0;
          activityTimes[activity] = time;
          totalTime += time;
        });

        // Sliding window for weekly average
        if (weeklyTimes.length < 7) {
          weeklyTimes.push(totalTime);
          weeklyTotal += totalTime;
        } else {
          weeklyTotal -= weeklyTimes.shift() || 0;
          weeklyTotal += totalTime;
          weeklyTimes.push(totalTime);
        }

        const weeklyAverage = weeklyTotal / weeklyTimes.length;

        chartData.push({
          date: displayDate,
          ...activityTimes,
          totalTime,
          dailyGoal: profile.dailyGoal,
          weeklyAverage,
        });

        // Move to next day
        currentDate = new Date(Date.UTC(year, month, day + 1));
      }
    }

    return NextResponse.json({ 
      success: true, 
      chartData 
    }, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
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

    if (!goal || goal < 30 || goal > 600) {
      return new NextResponse("Invalid goal value", { status: 400 });
    }

    // Update the profile with the new goal
    await db.profile.update({
      where: { id: profile.id },
      data: {
        dailyGoal: goal,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "Goal updated successfully",
      dailyGoal: goal
    }, { 
      status: 200 
    });
  } catch (error) {
    console.log("[DAILY GOAL POST ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
