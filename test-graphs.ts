import { db } from "./lib/db.ts";

async function testGraphs() {
  const profile = await db.profile.findFirst();
  if (!profile) return console.log("No profile");

  const startTime = new Date("2024-05-13T00:00:00.000Z");
  const endTime = new Date("2024-06-13T23:59:59.999Z");
  const byMonth = false;
  const allTime = false;

  console.log("Fetching logs...");
  const logs = await db.timerLog.findMany({
    where: {
      profileId: profile.id,
      startTime: {
        gte: startTime,
        lt: new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate() + 1)),
      },
    },
    orderBy: {
      startTime: 'asc',
    },
    select: { startTime: true, duration: true, activity: true },
  });

  console.log("Logs count:", logs.length);
  // simulate the rest
  const activities = ["Study", "Reading", "Coding", "Meditation", "Other"];
  const dateMap: any = {};

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
  let chartData = [];

  let currentDate = new Date(Date.UTC(startTime.getUTCFullYear(), startTime.getUTCMonth(), startTime.getUTCDate()));
  const endDate = new Date(Date.UTC(endTime.getUTCFullYear(), endTime.getUTCMonth(), endTime.getUTCDate()));

  let iterations = 0;
  while (currentDate <= endDate) {
    iterations++;
    if (iterations > 1000) {
        console.log("INFINITE LOOP");
        break;
    }
    const year = currentDate.getUTCFullYear();
    const month = currentDate.getUTCMonth();
    const day = currentDate.getUTCDate();
    const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    const activityTimes: any = {};
    let totalTime = 0;

    activities.forEach((activity) => {
      const time = dateMap[key]?.[activity] || 0;
      activityTimes[activity] = time;
      totalTime += time;
    });

    if (weeklyTimes.length < 7) {
      weeklyTimes.push(totalTime);
      weeklyTotal += totalTime;
    } else {
      weeklyTotal -= weeklyTimes.shift() || 0;
      weeklyTotal += totalTime;
      weeklyTimes.push(totalTime);
    }

    const weeklyAverage = weeklyTotal / weeklyTimes.length;

    chartData.push({
      ...activityTimes,
      totalTime,
      weeklyAverage,
    });

    currentDate = new Date(Date.UTC(year, month, day + 1));
  }
  
  console.log("Done. Chart data length:", chartData.length);
}

testGraphs().then(() => process.exit(0)).catch(console.error);
