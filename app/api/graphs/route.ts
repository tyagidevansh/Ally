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
    });


    if (byMonth) {
      const monthMap: { [key: string]: number } = {};

      logs.forEach((log) => {
        const month = log.startTime.toLocaleString('default', {month: "short", year: "numeric"});
        if (!monthMap[month]) {
          monthMap[month] = 0;
        }
        monthMap[month] += log.duration;
      });

      const chartData = [];
      for (let dt = new Date(startTime); dt <= endTime; dt.setMonth(dt.getMonth() + 1)) {
        const month = dt.toLocaleString('default', { month: "short", year: "numeric"});
        chartData.push({
          date: month.slice(0, 3),
          time: monthMap[month] || 0,
        });
      }

      return NextResponse.json({ success: "message recieved", chartData });

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

      const chartData = [];
      for (let dt = new Date(startTime); dt <= endTime; dt.setDate(dt.getDate() + 1)) {
        const date = dt.toDateString().slice(4, 10);
        const activityTimes: { [key: string]: number } = {};
        activities.forEach((activity) => {
          activityTimes[activity] = dateMap[date]?.[activity] || 0;
        });
        chartData.push({
          date,
          ...activityTimes,
        });
      }

      return NextResponse.json({ success: "message received", chartData });
    }

    
  } catch (error) {
    console.log("[GRAPHS ERROR] ", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
