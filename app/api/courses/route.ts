import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { getManagerSectionIds } from '@/utils/access';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { course_name, verse, course_description, objectives, section_id } = await request.json();

    if (!section_id) {
      return NextResponse.json({ error: "Section is required" }, { status: 400 });
    }
    if (!course_description) {
      return NextResponse.json({ error: "Course description is required" }, { status: 400 });
    }

    // Enforce manager access: managers can only assign courses to sections they manage
    if (user.user_role === 'MANAGER') {
      const sectionIds = await getManagerSectionIds(user.user_id);
      if (!sectionIds.includes(section_id)) {
        return NextResponse.json({
          error: 'Unauthorized: You can only assign courses to sections you manage'
        }, { status: 403 });
      }
    } else if (!['ADMIN'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const safeObjectives = Array.isArray(objectives) ? objectives.map((o: unknown) => String(o)) : [];

    const course = await prisma.course.create({
      data: {
        course_name: course_name || null,
        verse: verse || null,
        course_description,
        created_by: user.user_id,
        section_id,
        objectives: {
          create: safeObjectives.map((obj: string) => ({
            objective: obj,
          }))
        }
      },
      include: {
        objectives: true,
        section: true
      }
    });

    return NextResponse.json(course, { status: 201 });

  } catch (error) {
    console.error("Course creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const requestedSectionId = searchParams.get('sectionId');

    const whereClause: any = {};

    if (user.user_role === 'MANAGER') {
      const sectionIds = await getManagerSectionIds(user.user_id);

      if (requestedSectionId && requestedSectionId !== 'all') {
        if (!sectionIds.includes(requestedSectionId)) {
          return NextResponse.json({ error: 'Unauthorized: You do not manage this section' }, { status: 403 });
        }
        whereClause.section_id = requestedSectionId;
      } else {
        whereClause.section_id = { in: sectionIds };
      }
    } else if (user.user_role === 'ADMIN') {
      if (requestedSectionId && requestedSectionId !== 'all') {
        whereClause.section_id = requestedSectionId;
      }
    } else {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const courses = await prisma.course.findMany({
      where: whereClause,
      orderBy: { created_at: "desc" },
      include: {
        objectives: true,
        section: true,
        created_by_user: {
          select: {
            first_name: true,
            last_name: true,
            tg_username: true,
          },
        },
      }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
