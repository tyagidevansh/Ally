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

    if (!startTimeString || !endTimeString) {
      return new NextResponse("Invalid date range", { status: 400 });
    }

    const startTime = new Date(startTimeString);
    const endTime = new Date(endTimeString);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return new NextResponse("Invalid date format", { status: 400 });
    }

    const logs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
        startTime: {
          gte: startTime,
          lt: new Date(endTime.setDate(endTime.getDate())),
        },
      },
    });

    //todo : seperate tasks by activity

    const dateMap: { [key: string]: number } = {};

    logs.forEach((log) => {
      const date = log.startTime.toDateString().slice(4, 10); // MMM DD
      if (!dateMap[date]) {
        dateMap[date] = 0;
      }
      dateMap[date] += log.duration;
    });

    const chartData = [];
    for (let dt = new Date(startTime); dt <= endTime; dt.setDate(dt.getDate() + 1)) {
      const date = dt.toDateString().slice(4, 10);
      chartData.push({
        date,
        time: dateMap[date] || 0,
      });
    }

    return NextResponse.json({ success: "message received", chartData });
  } catch (error) {
    console.log("[GRAPHS ERROR] ", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
