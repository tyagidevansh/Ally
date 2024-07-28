import { currentProfile } from '@/lib/current-profile';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

interface TimerLogData {
  startTime: string;
  endTime: string;
  duration: number;
  activity: string;
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data: TimerLogData = await req.json();

    if (!data.startTime || !data.endTime || !data.duration || !data.activity) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const log = await db.timerLog.create({
      data: {
        profileId: profile.id,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        duration: data.duration,
        activity: data.activity
      }
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error creating timer log:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status : 401});
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const logs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
        startTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      select: {
        duration: true,
      },
    });

    const totalMicroseconds = logs.reduce((sum, log) => sum + log.duration, 0);

    return NextResponse.json({ totalMicroseconds });
  } catch (error) {
    console.error("Error fetching daily logs ",error);
    return new NextResponse("Internal server error" , {status: 500});
  }
}