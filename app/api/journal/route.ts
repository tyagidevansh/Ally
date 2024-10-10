import { currentProfile } from "@/lib/current-profile";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const take = parseInt(url.searchParams.get("take") || "20", 10);

    const journals = await db.journal.findMany({
      where: { profileId: profile.id },
      skip,
      take,
      orderBy: { created_at: "desc" },
    });
    console.log(journals);
    return NextResponse.json( journals );
  } catch (error) {
    console.error("[JOURNAL GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { entry, mood, nutrition, sleep }: { entry: string; mood?: number; nutrition?: number; sleep?: number } = await req.json();

    if (!entry || typeof entry !== "string") {
      return new NextResponse("Invalid request: 'entry' is required and should be a string", { status: 400 });
    }

    if (
      (mood !== undefined && (typeof mood !== "number" || mood < 1 || mood > 5)) ||
      (nutrition !== undefined && (typeof nutrition !== "number" || nutrition < 1 || nutrition > 5)) ||
      (sleep !== undefined && (typeof sleep !== "number" || sleep < 1 || sleep > 5))
    ) {
      return new NextResponse("Invalid request: 'mood', 'nutrition', and 'sleep' must be numbers between 1 and 5", { status: 400 });
    }

    await db.journal.create({
      data: {
        profileId: profile.id,
        entry,
        mood: mood ?? 3, 
        nutrition: nutrition ?? 3, 
        sleep: sleep ?? 3, 
        created_at: new Date(), 
      },
    });

    return new NextResponse(JSON.stringify({ message: "Journal entry created successfully" }), { status: 201 });
  } catch (error) {
    console.error("[JOURNAL POST ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

