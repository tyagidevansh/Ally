import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const recentLogs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
      },
      orderBy: {
        startTime: 'desc', 
      },
      take: 20, 
    });

    const formattedLogs = recentLogs.map(log => ({
      startTime: log.startTime,
      endTime: log.endTime,
      activity: log.activity,
      duration: log.duration,
    }));

    return NextResponse.json({ success: "recent times", logs: formattedLogs });

  } catch (error) {
    console.log("[RECENT LOGS ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
