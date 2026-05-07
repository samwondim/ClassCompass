import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';
import { getRequestUser } from '@/utils/request-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schedules = await prisma.schedule.findMany({
      where: { teacher_id: user.user_id },
      include: {
        course: {
          select: {
            course_id: true,
            course_name: true,
            verse: true,
            course_description: true,
            objectives: { select: { id: true, objective: true } },
          },
        },
        section: { select: { section_name: true, section_id: true } },
        teacher: { select: { user_id: true, first_name: true, last_name: true } },
      },
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Get my schedules error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
