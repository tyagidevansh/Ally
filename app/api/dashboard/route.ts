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
    const streak = await getStreak(profile);
    const comparison = await getFocusComparison(profile);
    const productiveHours = await getProductiveHours(profile, timezone);
    const recentSessions = await getRecentTimes(profile);
    const friendsStats = await getFriendsStats(profile);
    const friendRequests = await getFriendRequests(profile);
    const todos = await getTodos(profile);
    const cheers = await getCheers(profile);
    const graphData = await getDefaultGraphData(profile);

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
