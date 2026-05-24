import { currentProfile } from '@/lib/current-profile';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// PUT /api/timer-log/[id]  — edit a log
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const profile = await currentProfile();
    if (!profile) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = params;
    const data = await req.json();

    // Verify ownership
    const existing = await db.timerLog.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!existing) return new NextResponse('Not found', { status: 404 });

    const updated = await db.timerLog.update({
      where: { id },
      data: {
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        endTime:   data.endTime   ? new Date(data.endTime)   : undefined,
        duration:  data.duration  !== undefined ? Number(data.duration) : undefined,
        activity:  data.activity  ?? undefined,
        tag:       data.tag       !== undefined ? data.tag : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating timer log:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// DELETE /api/timer-log/[id]
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const profile = await currentProfile();
    if (!profile) return new NextResponse('Unauthorized', { status: 401 });

    const { id } = params;

    const existing = await db.timerLog.findFirst({
      where: { id, profileId: profile.id },
    });
    if (!existing) return new NextResponse('Not found', { status: 404 });

    await db.timerLog.delete({ where: { id } });

    return new NextResponse('Deleted', { status: 200 });
  } catch (error) {
    console.error('Error deleting timer log:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
