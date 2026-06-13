import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { getRecentTimes } from "@/lib/dashboard-queries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const logs = await getRecentTimes(profile);

    return NextResponse.json({ success: "recent times", logs });

  } catch (error) {
    console.error("[RECENT LOGS ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
