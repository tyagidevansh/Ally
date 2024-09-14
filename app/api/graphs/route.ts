import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    
    if (!profile) {
      return new NextResponse("Unauthorized", { status : 401});
    }

    const url = new URL(req.url);
    const startTimeString = url.searchParams.get('startTime');
    const endTimeString = url.searchParams.get('endTime');

    if (!startTimeString || !endTimeString) {
      return new NextResponse("Invalid date range", { status: 400 });
    }

    const startTime = new Date(startTimeString);
    const endTime = new Date(endTimeString);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return new NextResponse("Invalid date format", { status: 400 });
    }

    const dates = [];
    const durations = [];

    //to do: seperate chartLogs by activity

    for (let dt = new Date(startTime); dt <= endTime; dt.setDate(dt.getDate() + 1)) {
      dates.push(dt.toDateString().slice(4, 10));

      const currentDay = new Date(dt);
      const nextDay = new Date(dt);

      nextDay.setDate(dt.getDate() + 1);

      const logs = await db.timerLog.findMany({
        where: {
          profileId: profile.id,
          startTime: {
            gte: currentDay,
            lt: nextDay,
          },
        }
      });
      
      durations.push(logs.reduce((sum, log) => sum + log.duration, 0));      
    }

    const chartData = [];
    for (let i = 0; i < dates.length; i++) {
      chartData.push({
        date: dates[i],
        time: durations[i],
      })
    }

    return NextResponse.json({success: "message receieved", chartData});
  } catch (error) {
    console.log("[GRAPHS ERROR] ", error);
    return new NextResponse("Internal Error", {status: 500});
  }
}