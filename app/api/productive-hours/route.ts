import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { getProductiveHours } from "@/lib/dashboard-queries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userTimeZone = searchParams.get("timezone") || "UTC";

    const data = await getProductiveHours(profile, userTimeZone);
    return NextResponse.json(data);

  } catch (error) {
    console.error("[PRODUCTIVE HOURS ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
