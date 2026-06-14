import { db } from "@/lib/db";
import { unstable_cache } from "next/cache";

// Types to avoid needing full Prisma Client types imported if possible, 
// but we can just use 'any' or the implicit inferred types for rapid dev
type Profile = any;

/** Returns the UTC date string "YYYY-MM-DD" for a timestamp */
function utcDateStr(ts: number | Date): string {
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

/** UTC midnight (ms) for a given date string "YYYY-MM-DD" */
function utcMidnight(dateStr: string): number {
  return new Date(dateStr + 'T00:00:00.000Z').getTime();
}

export async function getStreak(profile: Profile) {
  const now = Date.now();
  const todayStr = utcDateStr(now);
  const todayStart = utcMidnight(todayStr);
  const dailyGoal = profile.dailyGoal ?? 180; // minutes
  const dailyGoalMs = dailyGoal * 60000;

  // ── Habits (for UI indicators, not streak) ──────────────────────
  const todos = await db.toDo.findMany({ where: { profileId: profile.id }, select: { isCompleted: true } });
  const allHabitsDone = todos.length > 0 && todos.every((t: any) => t.isCompleted);
  const todayHabitCount = todos.length;
  const completedHabitCount = todos.filter((t: any) => t.isCompleted).length;

  const lookbackDays = 365;
  const lookbackStart = todayStart - lookbackDays * 86400000;

  const logs = await db.timerLog.findMany({
    where: {
      profileId: profile.id,
      startTime: {
        gte: new Date(lookbackStart),
        lt: new Date(todayStart + 86400000),
      },
    },
    select: { startTime: true, duration: true },
  });

  const dayTotals = new Map<string, number>();
  for (const log of logs) {
    const dateKey = utcDateStr(log.startTime);
    dayTotals.set(dateKey, (dayTotals.get(dateKey) || 0) + (log.duration || 0));
  }

  let streak = 0;
  let todayComplete = false;
  let checkMs = todayStart;

  const todayTotal = dayTotals.get(todayStr) || 0;
  if (todayTotal >= dailyGoalMs) {
    todayComplete = true;
    streak = 1;
    checkMs -= 86400000; // yesterday
  } else {
    checkMs -= 86400000;
    const yesterdayStr = utcDateStr(checkMs);
    const yesterdayTotal = dayTotals.get(yesterdayStr) || 0;
    if (yesterdayTotal < dailyGoalMs) {
      // Background write update if necessary
      if (profile.streakStart !== null || profile.streakLast !== null) {
        db.profile.update({
          where: { id: profile.id },
          data: { streakStart: null, streakLast: null }
        }).catch(console.error);
      }

      return {
        currentStreak: 0,
        bestStreak: profile.bestStreak || 0,
        streakStartDate: now,
        streakLastDate: now,
        todayTime: todayTotal / 60000,
        dailyGoal,
        allHabitsDone,
        todayHabitCount,
        completedHabitCount,
      };
    }
    streak = 1;
    checkMs -= 86400000;
  }

  while (checkMs >= lookbackStart) {
    const dateKey = utcDateStr(checkMs);
    const total = dayTotals.get(dateKey) || 0;
    if (total < dailyGoalMs) break;
    streak++;
    checkMs -= 86400000;
  }

  const streakStartDate = checkMs + 86400000;
  const streakLastDate = todayComplete ? todayStart : todayStart - 86400000;

  const bestStreak = profile.bestStreak || 0;
  const newBestStreak = Math.max(bestStreak, streak);
  
  // Background write update if necessary
  const needsUpdate = 
    profile.bestStreak !== newBestStreak ||
    !profile.streakStart || new Date(profile.streakStart).getTime() !== streakStartDate ||
    !profile.streakLast || new Date(profile.streakLast).getTime() !== streakLastDate;
    
  if (needsUpdate) {
    const updateData: any = {
      streakStart: new Date(streakStartDate),
      streakLast: new Date(streakLastDate),
    };
    if (streak > bestStreak) {
      updateData.bestStreak = streak;
    }
    db.profile.update({ where: { id: profile.id }, data: updateData }).catch(console.error);
  }

  return {
    currentStreak: streak,
    bestStreak: newBestStreak,
    streakStartDate,
    streakLastDate,
    todayTime: todayTotal / 60000,
    dailyGoal,
    allHabitsDone,
    todayHabitCount,
    completedHabitCount,
  };
}

export async function getFocusComparison(profile: Profile) {
  const getCachedData = unstable_cache(
    async (profileId: string) => {
      const currentDate = new Date();
      const currentMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const currentMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      const previousMonthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const twoMonthsAgoStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, 1);
      const twoMonthsAgoEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

      const daysPassedThisMonth = currentDate.getDate();
      const previousMonthCurrentDay = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, daysPassedThisMonth + 1);
      const twoMonthsAgoCurrentDay = new Date(currentDate.getFullYear(), currentDate.getMonth() - 2, daysPassedThisMonth + 1);

      const [
        currentTotal,
        prevTotal,
        prevDayTotal,
        twoMonthsTotal,
        twoMonthsDayTotal
      ] = await Promise.all([
        db.timerLog.aggregate({ _sum: { duration: true }, where: { profileId: profileId, startTime: { gte: currentMonthStart, lt: currentMonthEnd } } }),
        db.timerLog.aggregate({ _sum: { duration: true }, where: { profileId: profileId, startTime: { gte: previousMonthStart, lt: previousMonthEnd } } }),
        db.timerLog.aggregate({ _sum: { duration: true }, where: { profileId: profileId, startTime: { gte: previousMonthStart, lt: previousMonthCurrentDay } } }),
        db.timerLog.aggregate({ _sum: { duration: true }, where: { profileId: profileId, startTime: { gte: twoMonthsAgoStart, lt: twoMonthsAgoEnd } } }),
        db.timerLog.aggregate({ _sum: { duration: true }, where: { profileId: profileId, startTime: { gte: twoMonthsAgoStart, lt: twoMonthsAgoCurrentDay } } })
      ]);

      const totalCurrentMonthTime = currentTotal._sum.duration || 0;
      const totalPreviousMonthTime = prevTotal._sum.duration || 0;
      const previousMonthTimeAtCurrentDay = prevDayTotal._sum.duration || 0;
      const totalTwoMonthsAgoTime = twoMonthsTotal._sum.duration || 0;
      const twoMonthsAgoTimeAtCurrentDay = twoMonthsDayTotal._sum.duration || 0;

      const lastDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); 
      const totalDaysInCurrentMonth = lastDayOfCurrentMonth.getDate();
      const averageTimePerDay = totalCurrentMonthTime / daysPassedThisMonth;
      const expectedTotalTimeForCurrentMonth = averageTimePerDay * totalDaysInCurrentMonth;

      return {
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
      };
    },
    ["focus-comparison", profile.id],
    { revalidate: 3600, tags: [`dashboard:${profile.id}`] }
  );

  return getCachedData(profile.id);
}

export async function getProductiveHours(profile: Profile, userTimeZone: string) {
  const getCachedData = unstable_cache(
    async (profileId: string, tz: string) => {
      const currentDate = new Date();
      const startDate = new Date(currentDate);
      startDate.setDate(currentDate.getDate() - 15);
      const endDate = new Date(currentDate);

      const allLogs = await db.timerLog.findMany({
        where: {
          profileId: profileId,
          startTime: {
            gte: startDate,
            lt: endDate,
          },
        },
        select: { startTime: true, duration: true },
      });

      const productivity = Array(24).fill(0);
      const hourCounts = Array(24).fill(0);

      allLogs.forEach(log => {
        const utcStartTime = new Date(log.startTime); 
        const localTime = new Date(utcStartTime.toLocaleString("en-US", { timeZone: tz }));
        const localHour = localTime.getHours(); 

        productivity[localHour] += log.duration;
        hourCounts[localHour] += 1;
      });

      const maxProductivity = Math.max(...productivity);
      const normalizedProductivity = productivity.map((value, index) =>
        hourCounts[index] > 0 ? value / (maxProductivity || 1) : 0
      );

      return normalizedProductivity.map((value, index) => ({
        hour: `${index}:00`,
        productivity: Math.round(value * 100)
      }));
    },
    ["productive-hours", profile.id, userTimeZone],
    { revalidate: 3600, tags: [`dashboard:${profile.id}`] }
  );

  return getCachedData(profile.id, userTimeZone);
}

export async function getRecentTimes(profile: Profile) {
  const recentLogs = await db.timerLog.findMany({
    where: {
      profileId: profile.id,
    },
    orderBy: {
      startTime: 'desc', 
    },
    take: 20,
    select: { id: true, startTime: true, endTime: true, activity: true, duration: true, tag: true },
  });

  return recentLogs;
}

export async function getDefaultGraphData(profile: Profile) {
  const userStartDate = new Date(Date.UTC(
    profile.createdAt.getUTCFullYear(), 
    profile.createdAt.getUTCMonth(), 
    profile.createdAt.getUTCDate()
  ));

  // Matches "30" days dropdown selection from graph.tsx
  const now30 = new Date();
  const endTime = new Date(Date.UTC(now30.getUTCFullYear(), now30.getUTCMonth(), now30.getUTCDate(), 23, 59, 59, 999));
  const startTime = new Date(Date.UTC(now30.getUTCFullYear(), now30.getUTCMonth(), now30.getUTCDate() - 30, 0, 0, 0, 0));
  // For running average, fetch 6 days prior to startTime
  const queryStartTime = new Date(Date.UTC(now30.getUTCFullYear(), now30.getUTCMonth(), now30.getUTCDate() - 36, 0, 0, 0, 0));
  
  const activities = ["Study", "Reading", "Coding", "Meditation", "Other"];

  const logs = await db.timerLog.findMany({
    where: {
      profileId: profile.id,
      startTime: {
        gte: queryStartTime,
        lt: new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate() + 1)),
      },
    },
    orderBy: {
      startTime: 'asc',
    },
    select: { startTime: true, duration: true, activity: true },
  });

  const chartData: any[] = [];
  const dateMap: { [key: string]: { [key: string]: number } } = {};

  logs.forEach((log) => {
    const year = log.startTime.getUTCFullYear();
    const month = log.startTime.getUTCMonth();
    const day = log.startTime.getUTCDate();
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    if (!dateMap[key]) {
      dateMap[key] = {};
      activities.forEach((activity) => {
        dateMap[key][activity] = 0;
      });
    }
    dateMap[key][log.activity] += log.duration;
  });

  let weeklyTimes: number[] = [];
  let weeklyTotal = 0;

  let currentDate = new Date(Date.UTC(queryStartTime.getUTCFullYear(), queryStartTime.getUTCMonth(), queryStartTime.getUTCDate()));
  const endDate = new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate()));
  const actualStartDate = new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate()));

  while (currentDate <= endDate) {
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    const day = currentDate.getUTCDate();
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const displayDate = `${monthNames[month]} ${String(day).padStart(2, '0')}`;
    
    const activityTimes: { [key: string]: number } = {};
    let totalTime = 0;

    activities.forEach((activity) => {
      const time = dateMap[key]?.[activity] || 0;
      activityTimes[activity] = time;
      totalTime += time;
    });

    if (currentDate >= userStartDate) {
      if (weeklyTimes.length < 7) {
        weeklyTimes.push(totalTime);
        weeklyTotal += totalTime;
      } else {
        weeklyTotal -= weeklyTimes.shift() || 0;
        weeklyTotal += totalTime;
        weeklyTimes.push(totalTime);
      }
    }

    const weeklyAverage = weeklyTimes.length > 0 ? (weeklyTotal / weeklyTimes.length) : 0;

    if (currentDate >= actualStartDate) {
      chartData.push({
        date: displayDate,
        ...activityTimes,
        totalTime,
        dailyGoal: profile.dailyGoal,
        weeklyAverage,
      });
    }

    currentDate = new Date(Date.UTC(year, month, day + 1));
  }

  return {
    chartData,
    params: {
      from: startTime.toISOString(),
      to: endTime.toISOString(),
      byMonth: false,
      allTime: false,
    }
  };
}

export async function getFriendsStats(profile: Profile) {
  const friendships = await db.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [
        { user1Id: profile.id },
        { user2Id: profile.id }
      ]
    },
    include: {
      user1: { select: { id: true, name: true, email: true, streakStart: true, streakLast: true, isFocusing: true } },
      user2: { select: { id: true, name: true, email: true, streakStart: true, streakLast: true, isFocusing: true } },
    }
  });

  const friendProfiles = friendships.map(f => {
    return f.user1Id === profile.id ? f.user2 : f.user1;
  });

  if (friendProfiles.length === 0) return [];

  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const friendIds = friendProfiles.map(p => p.id);

  // Parallelize these queries and use aggregation
  const [friendLogsAgg, completedTodosGroup] = await Promise.all([
    db.timerLog.groupBy({
      by: ['profileId'],
      where: {
        profileId: { in: friendIds },
        startTime: { gte: startOfDay }
      },
      _sum: { duration: true }
    }),
    db.toDo.groupBy({
      by: ['profileId'],
      where: {
        profileId: { in: friendIds },
        isCompleted: true,
        createdAt: { gte: startOfDay }
      },
      _count: { profileId: true }
    })
  ]);

  const focusedTimeMap = new Map(friendLogsAgg.map(agg => [agg.profileId, agg._sum.duration || 0]));
  const todosMap = new Map(completedTodosGroup.map(grp => [grp.profileId, grp._count.profileId || 0]));

  const stats = friendProfiles.map(friend => {
    const focusedTimeToday = focusedTimeMap.get(friend.id) || 0;
    const goalsHitToday = todosMap.get(friend.id) || 0;

    let currentStreak = 0;
    if (friend.streakStart && friend.streakLast) {
      const lastDay = Date.UTC(
        new Date(friend.streakLast).getUTCFullYear(),
        new Date(friend.streakLast).getUTCMonth(),
        new Date(friend.streakLast).getUTCDate()
      );
      const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const yesterdayUTC = todayUTC - 86400000;

      if (lastDay >= yesterdayUTC) {
        const startDay = Date.UTC(
          new Date(friend.streakStart).getUTCFullYear(),
          new Date(friend.streakStart).getUTCMonth(),
          new Date(friend.streakStart).getUTCDate()
        );
        const daysBetween = Math.round((lastDay - startDay) / 86400000);
        currentStreak = daysBetween + 1;
      }
    }

    return {
      id: friend.id,
      name: friend.name,
      email: friend.email,
      focusedTimeToday,
      goalsHitToday,
      streak: currentStreak,
      isFocusing: friend.isFocusing,
    };
  });

  return stats;
}

export async function getFriendRequests(profile: Profile) {
  const pendingRequests = await db.friendship.findMany({
    where: {
      user2Id: profile.id,
      status: "PENDING"
    },
    include: {
      user1: { select: { name: true, email: true } }
    }
  });

  return pendingRequests.map(req => ({
    id: req.id,
    senderName: req.user1.name,
    senderEmail: req.user1.email
  }));
}

export async function getTodos(profile: Profile) {
  const now = new Date();
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  if (new Date(profile.lastTodoReset) < startOfDay) {
    // Background reset if needed
    Promise.all([
      db.toDo.updateMany({
        where: { profileId: profile.id, isCompleted: true },
        data: { isCompleted: false },
      }),
      db.profile.update({
        where: { id: profile.id },
        data: { lastTodoReset: now },
      })
    ]).catch(console.error);
    
    // We should still fetch, but we fetch assuming they are reset to false
    // A quick hack is to fetch all, and manually set isCompleted to false for the response.
    const todos = await db.toDo.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
    });
    
    return todos.map(t => ({ ...t, isCompleted: false }));
  }

  return await db.toDo.findMany({
    where: { profileId: profile.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function getCheers(profile: Profile) {
  const cheers = await db.cheerSneer.findMany({
    where: {
      toId: profile.id,
      seen: false,
    },
    include: {
      from: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return cheers;
}
