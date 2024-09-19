import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

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
          lt: new Date(endTime.setDate(endTime.getDate())),
        },
      },
      orderBy: {
        startTime: "desc",
      }
    });

    const chartData = [];

    if (byMonth) {
      const monthMap: { [key: string]: { [key: string]: number } } = {};

      logs.forEach((log) => {
        const month = log.startTime.toLocaleString('default', { month: "short", year: "numeric" });
        
        if (!monthMap[month]) {
          monthMap[month] = {};
          activities.forEach((activity) => {
            monthMap[month][activity] = 0;
          });
        }
        
        monthMap[month][log.activity] += log.duration;
      });

      for (let dt = new Date(startTime); dt <= endTime; dt.setMonth(dt.getMonth() + 1)) {
        const month = dt.toLocaleString('default', { month: "short", year: "numeric" });
        
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
        });
      }
    } else {
      const dateMap: { [key: string]: {[key: string] : number} } = {};

      logs.forEach((log) => {
        const date = log.startTime.toDateString().slice(4, 10); // MMM DD
        if (!dateMap[date]) {
          dateMap[date] = {};
          activities.forEach((activity) => {
            dateMap[date][activity] = 0;
          });
        }
        dateMap[date][log.activity] += log.duration;
      });

      for (let dt = new Date(startTime); dt <= endTime; dt.setDate(dt.getDate() + 1)) {
        const date = dt.toDateString().slice(4, 10);
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
        });
      }
    }

    const recentTimes: { [key: string]: [number, string] } = {}; 

    for (let i = 0; i < 10; i++) {
      const indexTime:string = logs[i].startTime.toISOString()
      recentTimes[indexTime] = [logs[i].duration, logs[i].activity]
    }

    console.log(recentTimes);

    return NextResponse.json({ success: "message received", chartData });
  } catch (error) {
    console.log("[GRAPHS ERROR] ", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
