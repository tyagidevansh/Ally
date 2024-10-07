import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const userTimeZone = url.searchParams.get("timezone") || "UTC";

    const currentDateUtc = new Date().toISOString(); 
    const currentDateInUserTimeZone = toZonedTime(currentDateUtc, userTimeZone); // convert to user's timezone

    console.log("Requested User Time Zone:", userTimeZone);
    console.log("Current Date in UTC:", currentDateUtc);
    console.log("Converted User Time Zone Date:", currentDateInUserTimeZone);

    const startDateInUserTimeZone = new Date(currentDateInUserTimeZone);
    startDateInUserTimeZone.setDate(currentDateInUserTimeZone.getDate() - 15);

    const startDate = toZonedTime(startDateInUserTimeZone, userTimeZone);
    const endDate = toZonedTime(currentDateInUserTimeZone, userTimeZone);

    const allLogs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
        startTime: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const productivity = Array(24).fill(0);
    const hourCounts = Array(24).fill(0);

    allLogs.forEach(log => {
      const logDateInUtc = new Date(log.startTime);
      const logDateInUserTimeZone = fromZonedTime(logDateInUtc, userTimeZone); 
      const hour = logDateInUserTimeZone.getHours();
      //is this only counting productivity as when you start the timer?
      productivity[hour] += log.duration; 
      hourCounts[hour] += 1; 
    });

    // normalize the productivity data
    const maxProductivity = Math.max(...productivity);
    const normalizedProductivity = productivity.map((value, index) => 
      hourCounts[index] > 0 ? value / (maxProductivity || 1) : 0
    );

    const response = Object.fromEntries(normalizedProductivity.map((value, index) => [index, value]));

    return NextResponse.json(response);

  } catch (error) {
    console.log("[PRODUCTIVITY HOURS ERROR] ", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
