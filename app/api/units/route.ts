import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { getManagerSectionIds, managerCanAccessSection } from '@/utils/access';
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/utils/response';

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();

    const sectionId = request.nextUrl.searchParams.get('section_id');
    const where: any = {};

    if (user.user_role === 'ADMIN') {
      if (sectionId) where.section_id = sectionId;
    } else if (user.user_role === 'MANAGER' || user.user_role === 'TEACHER') {
      const sectionIds =
        user.user_role === 'MANAGER'
          ? await getManagerSectionIds(user.user_id)
          : (await prisma.teacherSection.findMany({ where: { teacher_id: user.user_id }, select: { section_id: true } })).map((ts: { section_id: string }) => ts.section_id);

      if (sectionId) {
        if (!sectionIds.includes(sectionId)) return forbidden('You do not have access to this section');
        where.section_id = sectionId;
      } else {
        where.section_id = { in: sectionIds };
      }
    } else {
      return forbidden();
    }

    const units = await prisma.curriculumUnit.findMany({
      where,
      orderBy: [{ order: 'asc' }, { created_at: 'asc' }],
      include: {
        section: { select: { section_id: true, section_name: true } },
        courses: {
          orderBy: { order: 'asc' },
          select: {
            course_id: true,
            course_name: true,
            verse: true,
            course_description: true,
            order: true,
          },
        },
      },
    });

    return ok({ units });
  } catch (error) {
    console.error('Get units error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) return forbidden('Only admins and managers can create units');

    const { title, description, order, period, section_id } = await request.json();

    if (!title || !section_id) return badRequest('Title and section are required');
    if (user.user_role === 'MANAGER' && !(await managerCanAccessSection(user.user_id, section_id))) {
      return forbidden('You do not manage this section');
    }

    const unit = await prisma.curriculumUnit.create({
      data: {
        title: title.trim(),
        description: description || null,
        order: Number(order) || 0,
        period: period || null,
        section_id,
        created_by: user.user_id,
      },
      include: { courses: true },
    });

    return created({ unit });
  } catch (error) {
    console.error('Create unit error:', error);
    return serverError();
  }
}
