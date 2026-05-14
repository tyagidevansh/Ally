import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { id, tag } = body;

    if (!id) {
      return new NextResponse("Missing timer log ID", { status: 400 });
    }

    const timerLog = await db.timerLog.findUnique({
      where: {
        id,
      },
    });

    if (!timerLog || timerLog.profileId !== profile.id) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    const updatedLog = await db.timerLog.update({
      where: {
        id,
      },
      data: {
        tag,
      },
    });

    return NextResponse.json(updatedLog);
  } catch (error) {
    console.log("[TIMER_LOG_TAG_PUT]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
