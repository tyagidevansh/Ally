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

    const todos = await db.toDo.findMany({
      where: {
        profileId: profile.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
 
    return NextResponse.json(todos);
  } catch (error) {
    console.error("[TODO GET ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { task, priority } = await req.json();

    if (!task || typeof task !== "string") {
      return new NextResponse("Invalid task input", { status: 400 });
    }

    const newTodo = await db.toDo.create({
      data: {
        id: crypto.randomUUID(),
        profileId: profile.id,
        task,
        priority: priority ?? 0,
        isCompleted: false,
      },
    });

    return NextResponse.json(newTodo);
  } catch (error) {
    console.error("[TODO POST ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id, isCompleted } = await req.json();

    const updatedTodo = await db.toDo.update({
      where: {
        id,
      },
      data: {
        isCompleted: isCompleted ?? false,
      },
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error("[TODO PUT ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const profile = await currentProfile();

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await req.json();

    await db.toDo.delete({
      where: {
        id,
      },
    });

    return new NextResponse("Deleted successfully", { status: 200 });
  } catch (error) {
    console.error("[TODO DELETE ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
