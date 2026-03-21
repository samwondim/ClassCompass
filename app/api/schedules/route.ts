import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';

export const dynamic = 'force-dynamic';

import { getRequestUser } from '@/utils/request-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user && user.user_role == "TEACHER") {
      const schedules = await prisma.schedule.findMany({
        where: {
          teacher_id: user.user_id
        },
        include: {

          course: { select: { course_id: true, course_name: true, verse: true, course_description: true } },
          section: { select: { section_name: true, section_id: true } },
          teacher: { select: { user_id: true, first_name: true, last_name: true } },
        }
      });

      return NextResponse.json({ schedules });
    }
    if (!["MANAGER", "ADMIN"].includes(user.user_role || "")) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const schedules = await prisma.schedule.findMany({
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
    if (!["MANAGER", "ADMIN"].includes(user.user_role || "")) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { course_id, teacher_id, schedule_date } = await request.json();
    console.log("AT SCHEDULE EP", teacher_id);

    // Validate inputs
    if (!course_id || !teacher_id || !schedule_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const scheduleDate = new Date(schedule_date);
    const existing_schedule = await prisma.schedule.findFirst({
      where: {
        course_id: course_id,
        teacher_id: teacher_id,
        schedule_date: scheduleDate
      }
    });

    if (existing_schedule) {
      return NextResponse.json({ message: "Schedule already exists" }, { status: 400 });
    }

    // Lookup Teacher's Section (Required for Schedule)
    const teacherSection = await prisma.teacherSection.findFirst({
      where: { teacher_id: teacher_id },
      include: { section: true }
    });

    if (!teacherSection) {
      return NextResponse.json({ error: "Selected teacher is not assigned to any section" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { course_id: course_id } });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const currentUser = await getRequestUser(request);
    const changerName = currentUser ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : "Admin";

    const schedule = await prisma.schedule.create({
      data: {
        course: { connect: { course_id } },
        teacher: { connect: { user_id: teacher_id } },
        section: { connect: { section_id: teacherSection.section_id } },
        schedule_date: scheduleDate, // Parse ISO
      },
      include: {
        course: { select: { course_id: true, course_name: true, verse: true, course_description: true } },
        teacher: { select: { user_id: true, first_name: true, last_name: true, tg_id: true } },
      },
    });

    // Notify Teacher
    if (schedule.teacher.tg_id) {
      const detail = `Date: ${new Date(schedule_date).toLocaleString()}
Section: ${teacherSection.section.section_name || 'N/A'}`;

      // Use import dynamically or at top. Importing at top is better.
      const { notifyScheduleChange } = await import('@/utils/notifications');
      await notifyScheduleChange(
        schedule.teacher.user_id,
        schedule.teacher.tg_id.toString(),
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
