import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/utils/request-auth';
import { getManagerSectionIds } from '@/utils/access';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const whereClause: any = {};

    if (user.user_role === 'MANAGER') {
      const sectionIds = await getManagerSectionIds(user.user_id);
      whereClause.section_id = { in: sectionIds };
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        course: { select: { course_name: true, course_description: true, verse: true } },
        teacher: { select: { first_name: true, last_name: true, tg_username: true } },
        section: { select: { section_name: true } },
      },
      orderBy: { schedule_date: 'asc' },
    });

    // Build CSV
    const header = ['Date', 'Course', 'Teacher', 'Telegram', 'Section', 'Verse'];
    const rows = schedules.map((s) => [
      s.schedule_date.toISOString(),
      s.course.course_name || s.course.course_description || '',
      `${s.teacher.first_name || ''} ${s.teacher.last_name || ''}`.trim(),
      s.teacher.tg_username || '',
      s.section.section_name || '',
      s.course.verse || '',
    ]);

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((row) => row.map((v) => escape(String(v))).join(',')).join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="schedule-report.csv"',
      },
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
