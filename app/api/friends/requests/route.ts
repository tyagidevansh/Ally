import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getFriendRequests } from "@/lib/dashboard-queries";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const requestsData = await getFriendRequests(profile);
    return NextResponse.json(requestsData);
  } catch (error) {
    console.error("[FRIENDS_REQUESTS GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, accept } = await req.json();

    if (!id) {
      return new NextResponse("Missing request id", { status: 400 });
    }

    const friendship = await db.friendship.findUnique({
      where: { id },
      select: { id: true, user2Id: true },
    });

    if (!friendship || friendship.user2Id !== profile.id) {
      return new NextResponse("Not found or unauthorized", { status: 404 });
    }

    if (accept) {
      const updated = await db.friendship.update({
        where: { id },
        data: { status: "ACCEPTED" }
      });
      return NextResponse.json(updated);
    } else {
      await db.friendship.delete({
        where: { id }
      });
      return new NextResponse("Deleted", { status: 200 });
    }
  } catch (error) {
    console.error("[FRIENDS_REQUESTS PUT ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
