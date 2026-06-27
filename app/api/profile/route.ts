import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { username } = await req.json();

    const updatedProfile = await db.profile.update({
      where: {
        id: profile.id,
      },
      data: {
        name: username,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("[PROFILE PATCH ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
