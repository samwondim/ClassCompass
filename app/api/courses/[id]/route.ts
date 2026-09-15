import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { managerCanAccessSection } from '@/utils/access';

async function authorizeCourse(user: any, course: any) {
  if (user.user_role === 'ADMIN') return true;
  if (user.user_role === 'MANAGER' && course.section_id) {
    return managerCanAccessSection(user.user_id, course.section_id);
  }
  return false;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const course = await prisma.course.findUnique({
      where: { course_id: id },
      include: { objectives: true, created_by_user: { select: { first_name: true, last_name: true, tg_username: true } } },
    });

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    if (!(await authorizeCourse(user, course))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.course.findUnique({ where: { course_id: id } });
    if (!existing) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    if (!(await authorizeCourse(user, existing))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { course_name, verse, course_description, objectives } = body;

    if (course_description === undefined || course_description === null || course_description === '') {
      return NextResponse.json({ error: 'Course description is required' }, { status: 400 });
    }

    const safeObjectives = Array.isArray(objectives) ? objectives.map((o: unknown) => String(o)) : [];

    const updated = await prisma.$transaction(async (tx) => {
      await tx.objective.deleteMany({ where: { course_id: id } });
      return tx.course.update({
        where: { course_id: id },
        data: {
          course_name: course_name || null,
          verse: verse || null,
          course_description,
          objectives: {
            create: safeObjectives.map((obj: string) => ({ objective: obj })),
          },
        },
        include: { objectives: true },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update course error:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const course = await prisma.course.findUnique({ where: { course_id: id } });
    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    if (!(await authorizeCourse(user, course))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.course.delete({ where: { course_id: id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
