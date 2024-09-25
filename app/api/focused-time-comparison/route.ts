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
    const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    
    const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    const twoMonthsAgoStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
    const twoMonthsAgoEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    const allLogs = await db.timerLog.findMany({
      where: {
        profileId: profile.id,
        startTime: {
          gte: twoMonthsAgoStart,
          lt: currentMonthEnd,
        },
      },
    });

    const daysPassedThisMonth = currentDate.getDate();

    const calculateTime = (logs: any[], startDate: number | Date, endDate: number | Date, daysPassed: number) => {
      const filteredLogs = logs.filter(log => log.startTime >= startDate && log.startTime < endDate);
      const totalTime = filteredLogs.reduce((total, log) => total + log.duration, 0);
      const timeAtCurrentDay = filteredLogs
        .filter(log => new Date(log.startTime).getDate() <= daysPassed)
        .reduce((total, log) => total + log.duration, 0);
      
      return { totalTime, timeAtCurrentDay };
    };

    const { totalTime: totalCurrentMonthTime } = calculateTime(allLogs, currentMonthStart, currentMonthEnd, daysPassedThisMonth);
    const { totalTime: totalPreviousMonthTime, timeAtCurrentDay: previousMonthTimeAtCurrentDay } = calculateTime(allLogs, previousMonthStart, previousMonthEnd, daysPassedThisMonth);
    const { totalTime: totalTwoMonthsAgoTime, timeAtCurrentDay: twoMonthsAgoTimeAtCurrentDay } = calculateTime(allLogs, twoMonthsAgoStart, twoMonthsAgoEnd, daysPassedThisMonth);

    const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); 
    const totalDaysInCurrentMonth = lastDayOfCurrentMonth.getDate();
    const averageTimePerDay = totalCurrentMonthTime / daysPassedThisMonth;
    const expectedTotalTimeForCurrentMonth = averageTimePerDay * totalDaysInCurrentMonth;

    return NextResponse.json({
      currentMonth: {
        total: totalCurrentMonthTime / 60000,
        expectedTotal: expectedTotalTimeForCurrentMonth / 60000,
      },
      previousMonth: {
        total: totalPreviousMonthTime / 60000,
        timeAtCurrentDay: previousMonthTimeAtCurrentDay / 60000,
      },
      twoMonthsAgo: {
        total: totalTwoMonthsAgoTime / 60000,
        timeAtCurrentDay: twoMonthsAgoTimeAtCurrentDay / 60000,
      },
    });

  } catch (error) {
    console.log("[FOCUSED TIME COMPARISON ERROR] ", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

