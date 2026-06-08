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

    // Find all accepted friendships
    const friendships = await db.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [
          { user1Id: profile.id },
          { user2Id: profile.id }
        ]
      },
      include: {
        user1: true,
        user2: true
      }
    });

    // Get the friend profiles
    const friendProfiles = friendships.map(f => {
      return f.user1Id === profile.id ? f.user2 : f.user1;
    });

    if (friendProfiles.length === 0) {
      return NextResponse.json([]);
    }

    const now = new Date();
    const startOfDay = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      0, 0, 0, 0
    ));

    const friendIds = friendProfiles.map(p => p.id);

    // Fetch TimerLogs for today for all friends (filter by startTime, not createdAt)
    const todayLogs = await db.timerLog.findMany({
      where: {
        profileId: { in: friendIds },
        startTime: { gte: startOfDay }
      }
    });

    // Fetch completed ToDos for all friends that were created TODAY
    const completedTodos = await db.toDo.findMany({
      where: {
        profileId: { in: friendIds },
        isCompleted: true,
        createdAt: { gte: startOfDay }
      }
    });

    // Calculate stats
    const stats = friendProfiles.map(friend => {
      const friendLogs = todayLogs.filter(log => log.profileId === friend.id);
      const focusedTimeToday = friendLogs.reduce((total, log) => total + log.duration, 0);
      
      // We'll count todos created today and completed, or just all completed ones for simplicity
      // since the schema doesn't track exactly when a todo was completed.
      const friendTodos = completedTodos.filter(todo => todo.profileId === friend.id);
      const goalsHitToday = friendTodos.length;

      // Read the streak from the friend's stored profile data.
      // These are updated each time the friend loads their own dashboard.
      // We must also verify the streak is still alive — if streakLast is
      // older than yesterday, the streak has been broken.
      let currentStreak = 0;
      if (friend.streakStart && friend.streakLast) {
        const lastDay = Date.UTC(
          new Date(friend.streakLast).getUTCFullYear(),
          new Date(friend.streakLast).getUTCMonth(),
          new Date(friend.streakLast).getUTCDate(),
        );
        const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        const yesterdayUTC = todayUTC - 86400000;

        // Only count as a live streak if last completed day is today or yesterday
        if (lastDay >= yesterdayUTC) {
          const startDay = Date.UTC(
            new Date(friend.streakStart).getUTCFullYear(),
            new Date(friend.streakStart).getUTCMonth(),
            new Date(friend.streakStart).getUTCDate(),
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

    return NextResponse.json(stats);
  } catch (error) {
    console.error("[FRIENDS_STATS GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
