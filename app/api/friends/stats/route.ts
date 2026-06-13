import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { getFriendsStats } from "@/lib/dashboard-queries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const stats = await getFriendsStats(profile);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[FRIENDS_STATS GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
