import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { getManagerSectionIds } from '@/utils/access';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.user_role === 'TEACHER') {
      const schedules = await prisma.schedule.findMany({
        where: { teacher_id: user.user_id },
        include: {
          course: { select: { course_id: true, course_name: true, verse: true, course_description: true, objectives: { select: { id: true, objective: true } } } },
          section: { select: { section_name: true, section_id: true } },
          teacher: { select: { user_id: true, first_name: true, last_name: true } },
        }
      });
      return NextResponse.json({ schedules });
    }

    if (!['MANAGER', 'ADMIN'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const whereClause: any = {};

    if (user.user_role === 'MANAGER') {
      const sectionIds = await getManagerSectionIds(user.user_id);
      whereClause.section_id = { in: sectionIds };
    } else if (user.user_role === 'ADMIN') {
      const sectionId = request.nextUrl.searchParams.get('section_id');
      if (sectionId && sectionId !== 'all') {
        whereClause.section_id = sectionId;
      }
    }

    const schedules = await prisma.schedule.findMany({
      where: whereClause,
      include: {
        course: { select: { course_id: true, course_name: true, verse: true, course_description: true } },
        teacher: { select: { user_id: true, first_name: true, last_name: true } },
        section: { select: { section_name: true, section_id: true } },
      },
    });
    return NextResponse.json({ schedules });
  }
  catch (error) {
    console.error('Get schedules error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!['MANAGER', 'ADMIN'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { course_id, teacher_id, schedule_date } = await request.json();

    if (!course_id || !teacher_id || !schedule_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const scheduleDate = new Date(schedule_date);
    if (isNaN(scheduleDate.getTime())) {
      return NextResponse.json({ error: "Invalid schedule date" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { course_id } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const teacherSections = await prisma.teacherSection.findMany({ where: { teacher_id } });
    if (teacherSections.length === 0) {
      return NextResponse.json({ error: "Selected teacher is not assigned to any section" }, { status: 400 });
    }

    // Deterministic section resolution: prefer the course's section when the
    // teacher is assigned to it, otherwise require an unambiguous single section.
    let sectionId: string | null = null;
    if (course.section_id && teacherSections.some(ts => ts.section_id === course.section_id)) {
      sectionId = course.section_id;
    } else if (teacherSections.length === 1) {
      sectionId = teacherSections[0].section_id;
    }

    if (!sectionId) {
      return NextResponse.json({ error: "Teacher is assigned to multiple sections; unable to determine section" }, { status: 400 });
    }

    if (user.user_role === 'MANAGER') {
      const sectionIds = await getManagerSectionIds(user.user_id);
      if (!sectionIds.includes(sectionId)) {
        return NextResponse.json({ error: "Cannot create schedule for a teacher outside your sections" }, { status: 403 });
      }
    }

    const existing_schedule = await prisma.schedule.findFirst({
      where: {
        course_id,
        teacher_id,
        schedule_date: scheduleDate
      }
    });

    if (existing_schedule) {
      return NextResponse.json({ message: "Schedule already exists" }, { status: 400 });
    }

    const changerName = user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Admin';

    const schedule = await prisma.schedule.create({
      data: {
        course: { connect: { course_id } },
        teacher: { connect: { user_id: teacher_id } },
        section: { connect: { section_id: sectionId } },
        schedule_date: scheduleDate,
      },
      include: {
        course: { select: { course_id: true, course_name: true, verse: true, course_description: true } },
        teacher: { select: { user_id: true, first_name: true, last_name: true, tg_id: true } },
        section: { select: { section_id: true, section_name: true } },
      },
    });

    if (schedule.teacher.tg_id) {
      const detail = `Date: ${new Date(schedule_date).toLocaleDateString()}
Section: ${schedule.section.section_name || 'N/A'}`;

      const { notifyScheduleChange } = await import('@/utils/notifications');
      await notifyScheduleChange(
        schedule.teacher.user_id,
        schedule.teacher.tg_id,
        'Added',
        schedule.course.course_name || schedule.course.course_description || 'Unknown Course',
        changerName,
        detail
      );
    }

    return NextResponse.json({ schedule }, { status: 201 });

  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
