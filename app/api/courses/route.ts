import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';
import { getSession } from '@/utils/session';
import { Course } from '@/app/models/models';

export async function POST(req: Request) {
  try {
    const created_by = await getSession().then(session => session.fetched_user.user_id);
    const { course_description, objectives } = await req.json();

    if (!created_by) {
      return NextResponse.json({ error: "Missing created_by user_id" }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        course_name: "",
        course_description,
        created_by,
        objectives: {
          create: objectives.map((obj: string) => ({
            objective: obj,
          }))
        }
      },
      include: {
        objectives: true
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
    const courses = await prisma.course.findMany({
      orderBy: { created_at: "desc" },
      include: {
        objectives: true, // <-- include all objectives for each course
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

