import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';
import { getSession } from '@/utils/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const created_by = session.fetched_user.user_id;
    if (!session || session.fetched_user.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const courses = await prisma.course.findMany({
      select: { course_id: true, course_description: true },
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const created_by = session.fetched_user.user_id;
    const data = await request.json();

    if (!session || session.fetched_user.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const courses = await prisma.course.create({
      data: { course_description: data.course_description },
    });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Get courses error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
