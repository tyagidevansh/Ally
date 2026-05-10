import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new NextResponse("Invalid email", { status: 400 });
    }

    if (email.toLowerCase() === profile.email.toLowerCase()) {
      return NextResponse.json({ error: "Cannot add yourself." }, { status: 400 });
    }

    const friendProfile = await db.profile.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive'
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!friendProfile) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Check if friendship already exists
    const existingFriendship = await db.friendship.findFirst({
      where: {
        OR: [
          { user1Id: profile.id, user2Id: friendProfile.id },
          { user1Id: friendProfile.id, user2Id: profile.id }
        ]
      }
    });

    if (existingFriendship) {
      return NextResponse.json({ error: "Friendship or request already exists." }, { status: 400 });
    }

    const friendship = await db.friendship.create({
      data: {
        user1Id: profile.id,
        user2Id: friendProfile.id,
        status: "PENDING"
      }
    });

    return NextResponse.json(friendship);
  } catch (error) {
    console.error("[FRIENDS POST ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
