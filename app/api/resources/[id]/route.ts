import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { getManagerSectionIds } from '@/utils/access';
import { del } from '@vercel/blob';
import { ok, unauthorized, forbidden, notFound, serverError } from '@/utils/response';

async function resolveSectionIds(user: any): Promise<string[]> {
  if (user.user_role === 'ADMIN') return [];
  if (user.user_role === 'MANAGER') return getManagerSectionIds(user.user_id);
  if (user.user_role === 'TEACHER') {
    const ts = await prisma.teacherSection.findMany({ where: { teacher_id: user.user_id }, select: { section_id: true } });
    return ts.map((t: { section_id: string }) => t.section_id);
  }
  return [];
}

async function canView(user: any, resource: any, sectionIds: string[]): Promise<boolean> {
  if (user.user_role === 'ADMIN') return true;
  if (resource.section_id && sectionIds.includes(resource.section_id)) return true;
  if (resource.course_id) {
    const course = await prisma.course.findUnique({ where: { course_id: resource.course_id }, select: { section_id: true } });
    if (course?.section_id && sectionIds.includes(course.section_id)) return true;
  }
  return false;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();

    const { id } = await params;
    const resource = await prisma.resource.findUnique({
      where: { resource_id: id },
      include: {
        course: { select: { course_id: true, course_name: true } },
        section: { select: { section_id: true, section_name: true } },
      },
    });
    if (!resource) return notFound('Resource not found');

    const sectionIds = await resolveSectionIds(user);
    if (!(await canView(user, resource, sectionIds))) return forbidden();

    return ok({ resource });
  } catch (error) {
    console.error('Get resource error:', error);
    return serverError();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) return forbidden('Only admins and managers can delete resources');

    const { id } = await params;
    const resource = await prisma.resource.findUnique({ where: { resource_id: id } });
    if (!resource) return notFound('Resource not found');

    if (user.user_role === 'MANAGER') {
      const sectionIds = await getManagerSectionIds(user.user_id);
      if (!(await canView(user, resource, sectionIds))) return forbidden();
    }

    await prisma.resource.delete({ where: { resource_id: id } });

    // Remove the underlying blob for uploaded files (external links are left untouched).
    if (resource.type !== 'LINK') {
      try {
        await del(resource.url);
      } catch (err) {
        console.error('Failed to delete blob:', err);
      }
    }

    return ok({ success: true });
  } catch (error) {
    console.error('Delete resource error:', error);
    return serverError();
  }
}
