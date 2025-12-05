import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';
import { getSession } from '@/utils/session';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession().then(session => session?.fetched_user);

    if (user && user.user_role == "TEACHER") {
      const schedules = await prisma.schedule.findMany({
        where: {
          teacher_id: user.user_id
        },
        include: {

          course: { select: { course_id: true, course_description: true } },
        }
      });

      return NextResponse.json({ schedules });
    }
    const schedules = await prisma.schedule.findMany({
      include: {
        course: { select: { course_id: true, course_description: true } },
        teacher: { select: { user_id: true, first_name: true, last_name: true } },
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
    const { course_id, teacher_id, schedule_date } = await request.json();
    console.log("AT SCHEDULE EP", teacher_id);

    // Validate inputs
    if (!course_id || !teacher_id || !schedule_date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing_schedule = await prisma.schedule.findFirst({ where: { course_id: course_id, teacher_id: teacher_id } });

    if (existing_schedule) {
      return NextResponse.json({ message: "Schedule already exists" }, { status: 400 });
    }

    // Lookup Teacher's Section (Required for Schedule)
    const teacherSection = await prisma.teacherSection.findFirst({
      where: { teacher_id: teacher_id }
    });

    if (!teacherSection) {
      return NextResponse.json({ error: "Selected teacher is not assigned to any section" }, { status: 400 });
    }

    const course = await prisma.course.findUnique({ where: { course_id: course_id } });

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const schedule = await prisma.schedule.create({
      data: {
        course: { connect: { course_id } },
        teacher: { connect: { user_id: teacher_id } },
        section: { connect: { section_id: teacherSection.section_id } },
        schedule_date: new Date(schedule_date), // Parse ISO
      },
      include: {
        course: { select: { course_id: true, course_description: true } },
        teacher: { select: { user_id: true, first_name: true, last_name: true } },
      },
    });
    return NextResponse.json({ schedule }, { status: 201 });

  } catch (error) {
    console.error('Create schedule error:', error);
    return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
  }
}
