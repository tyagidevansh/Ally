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

    const currentDate = new Date();
    const startDate = new Date(currentDate);
    startDate.setDate(currentDate.getDate() - 15);
    const endDate = new Date(currentDate);

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
      const logDate = new Date(log.startTime);
      const hour = logDate.getHours();
      productivity[hour] += log.duration; 
      hourCounts[hour] += 1; 
    });

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
