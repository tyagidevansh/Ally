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
  getDefaultGraphData,
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

    // Run all database queries concurrently
    const [
      streak,
      comparison,
      productiveHours,
      recentSessions,
      friendsStats,
      friendRequests,
      todos,
      cheers,
      graphData,
    ] = await Promise.all([
      getStreak(profile),
      getFocusComparison(profile),
      getProductiveHours(profile, timezone),
      getRecentTimes(profile),
      getFriendsStats(profile),
      getFriendRequests(profile),
      getTodos(profile),
      getCheers(profile),
      getDefaultGraphData(profile),
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
      graphData,
    });
  } catch (error) {
    console.error("[DASHBOARD_API GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
