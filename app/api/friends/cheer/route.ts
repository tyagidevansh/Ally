import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Send a cheer or sneer to a friend
export async function POST(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { friendId, type, message } = await req.json();

    if (!friendId || !type || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (type !== "CHEER" && type !== "SNEER") {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    if (message.length > 100) {
      return NextResponse.json({ error: "Message too long" }, { status: 400 });
    }

    // Verify they are actually friends
    const friendship = await db.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { user1Id: profile.id, user2Id: friendId },
          { user1Id: friendId, user2Id: profile.id },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "Not friends" }, { status: 403 });
    }

    // Delete any existing unseen cheer/sneer from this sender to this recipient
    // (overwrite behavior — only the latest one matters)
    await db.cheerSneer.deleteMany({
      where: {
        fromId: profile.id,
        toId: friendId,
        seen: false,
      },
    });

    // Create the new cheer/sneer
    const cheerSneer = await db.cheerSneer.create({
      data: {
        fromId: profile.id,
        toId: friendId,
        type,
        message,
      },
    });

    return NextResponse.json(cheerSneer);
  } catch (error) {
    console.error("[CHEER_SNEER POST ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Get unseen cheers/sneers for the current user
export async function GET(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cheers = await db.cheerSneer.findMany({
      where: {
        toId: profile.id,
        seen: false,
      },
      include: {
        from: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(cheers);
  } catch (error) {
    console.error("[CHEER_SNEER GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Mark cheers/sneers as seen
export async function PUT(req: Request) {
  try {
    const profile = await currentProfile();
    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Missing ids" }, { status: 400 });
    }

    await db.cheerSneer.updateMany({
      where: {
        id: { in: ids },
        toId: profile.id,
      },
      data: {
        seen: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CHEER_SNEER PUT ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
