import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { getManagerSectionIds, managerCanAccessSection } from '@/utils/access';
import { ok, badRequest, unauthorized, forbidden, notFound, serverError } from '@/utils/response';

async function canAccessUnit(user: any, unit: any): Promise<boolean> {
  if (user.user_role === 'ADMIN') return true;
  if (user.user_role === 'MANAGER') {
    const ids = await getManagerSectionIds(user.user_id);
    return ids.includes(unit.section_id);
  }
  return false;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const unit = await prisma.curriculumUnit.findUnique({
      where: { unit_id: id },
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
    if (!unit) return notFound('Unit not found');

    if (!(await canAccessUnit(user, unit))) return forbidden();

    return ok({ unit });
  } catch (error) {
    console.error('Get unit error:', error);
    return serverError();
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) return forbidden('Only admins and managers can update units');

    const { id } = await params;
    const unit = await prisma.curriculumUnit.findUnique({ where: { unit_id: id } });
    if (!unit) return notFound('Unit not found');
    if (!(await canAccessUnit(user, unit))) return forbidden();

    const body = await request.json();
    const data: any = {};
    if (body.title !== undefined) data.title = body.title.trim();
    if (body.description !== undefined) data.description = body.description || null;
    if (body.order !== undefined) data.order = Number(body.order) || 0;
    if (body.period !== undefined) data.period = body.period || null;

    if (body.section_id !== undefined && body.section_id !== unit.section_id) {
      if (user.user_role === 'MANAGER' && !(await managerCanAccessSection(user.user_id, body.section_id))) {
        return forbidden('You do not manage the target section');
      }
      data.section_id = body.section_id;
    }

    if (!data.title && data.title !== undefined && !data.title.length) {
      return badRequest('Title cannot be empty');
    }

    const updated = await prisma.curriculumUnit.update({
      where: { unit_id: id },
      data,
      include: { courses: true },
    });

    return ok({ unit: updated });
  } catch (error) {
    console.error('Update unit error:', error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) return forbidden('Only admins and managers can delete units');

    const { id } = await params;
    const unit = await prisma.curriculumUnit.findUnique({ where: { unit_id: id } });
    if (!unit) return notFound('Unit not found');
    if (!(await canAccessUnit(user, unit))) return forbidden();

    await prisma.curriculumUnit.delete({ where: { unit_id: id } });

    return ok({ success: true });
  } catch (error) {
    console.error('Delete unit error:', error);
    return serverError();
  }
}
