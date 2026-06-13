import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import {
  getStreak,
  getFocusComparison,
  getProductiveHours,
  getRecentTimes,
  getFriendsStats,
  getFriendRequests,
  getTodos,
  getCheers,
} from "@/lib/dashboard-queries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timezone = searchParams.get("timezone") || "UTC";

    // Batch 1: lightweight queries
    const [streak, comparison, productiveHours, recentSessions, todos, cheers] = await Promise.all([
      getStreak(profile),
      getFocusComparison(profile),
      getProductiveHours(profile, timezone),
      getRecentTimes(profile),
      getTodos(profile),
      getCheers(profile),
    ]);

    // Batch 2: friends queries (these query other users' data)
    const [friendsStats, friendRequests] = await Promise.all([
      getFriendsStats(profile),
      getFriendRequests(profile),
    ]);

    return NextResponse.json({
      streak,
      comparison,
      productiveHours,
      recentSessions,
      friendsStats,
      friendRequests,
      todos,
      cheers,
    });
  } catch (error) {
    console.error("[DASHBOARD_API GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
