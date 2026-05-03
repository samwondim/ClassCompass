import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';

export const dynamic = 'force-dynamic';

import { getSession } from '@/utils/session';
import { Course } from '@/app/models/models';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    const user = session?.fetched_user;
    const created_by = user?.user_id;
    const { course_name, verse, course_description, objectives, section_id } = await request.json();

    if (!created_by || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!section_id) {
      return NextResponse.json({ error: "Section is required" }, { status: 400 });
    }

    // Enforce manager access: managers can only assign courses to sections they manage
    if (user.user_role === 'MANAGER') {
      const managerOwnsSection = await prisma.managerSection.findFirst({
        where: {
          manager_id: user.user_id,
          section_id: section_id
        }
      });

      if (!managerOwnsSection) {
        return NextResponse.json({
          error: 'Unauthorized: You can only assign courses to sections you manage'
        }, { status: 403 });
      }
    }

    const safeObjectives = Array.isArray(objectives) ? objectives : [];
    if (!course_description) {
      return NextResponse.json({ error: "Course description is required" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        course_name: course_name || null,
        verse: verse || null,
        course_description,
        created_by,
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
    const session = await getSession(request);
    const user = session?.fetched_user;

    const searchParams = request.nextUrl.searchParams;
    const requestedSectionId = searchParams.get('sectionId');

    const whereClause: any = {};

    if (user?.user_role === 'MANAGER') {
      const managerSections = await prisma.managerSection.findMany({
        where: { manager_id: user.user_id },
        select: { section_id: true }
      });
      const sectionIds = managerSections.map(ms => ms.section_id);
      
      if (requestedSectionId && requestedSectionId !== 'all') {
        if (!sectionIds.includes(requestedSectionId)) {
          return NextResponse.json({ error: 'Unauthorized: You do not manage this section' }, { status: 403 });
        }
        whereClause.section_id = requestedSectionId;
      } else {
        whereClause.section_id = { in: sectionIds };
      }
    } else if (user?.user_role === 'ADMIN') {
      if (requestedSectionId && requestedSectionId !== 'all') {
        whereClause.section_id = requestedSectionId;
      }
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
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 });
  }
}
