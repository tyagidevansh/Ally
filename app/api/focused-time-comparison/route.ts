import { currentProfile } from "@/lib/current-profile";
import { NextResponse } from "next/server";
import { getFocusComparison } from "@/lib/dashboard-queries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await getFocusComparison(profile);
    return NextResponse.json(data);

  } catch (error) {
    console.error("[FOCUSED TIME COMPARISON ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
