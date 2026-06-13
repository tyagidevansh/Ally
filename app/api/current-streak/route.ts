import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getStreak } from "@/lib/dashboard-queries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const streakData = await getStreak(profile);
    return NextResponse.json(streakData);

  } catch (error) {
    console.error("[CURRENT_STREAK GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// POST remains for any legacy callers but streak logic now lives in GET
export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) return new NextResponse("Unauthorized", { status: 401 });

    const data = await req.json();
    const updateData: any = {};
    if (data.streakStart !== undefined) updateData.streakStart = new Date(data.streakStart);
    if (data.streakLast  !== undefined) updateData.streakLast  = new Date(data.streakLast);
    if (data.bestStreak  !== undefined) updateData.bestStreak  = data.bestStreak;

    if (Object.keys(updateData).length === 0) {
      return new NextResponse("Missing fields", { status: 400 });
    }

    await db.profile.update({ where: { id: profile.id }, data: updateData });
    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("[STREAK POST ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}