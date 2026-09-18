import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { getManagerSectionIds, managerCanAccessSection } from '@/utils/access';
import { put } from '@vercel/blob';
import { ok, created, badRequest, unauthorized, forbidden, serverError } from '@/utils/response';

const VALID_TYPES = ['FILE', 'LINK', 'IMAGE', 'VIDEO'];

export async function GET(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();

    const courseId = request.nextUrl.searchParams.get('course_id');
    const sectionId = request.nextUrl.searchParams.get('section_id');

    const where: any = {};

    if (user.user_role === 'ADMIN') {
      if (courseId) where.course_id = courseId;
      else if (sectionId) where.section_id = sectionId;
    } else if (user.user_role === 'MANAGER' || user.user_role === 'TEACHER') {
      const sectionIds =
        user.user_role === 'MANAGER'
          ? await getManagerSectionIds(user.user_id)
          : (await prisma.teacherSection.findMany({ where: { teacher_id: user.user_id }, select: { section_id: true } })).map((ts: { section_id: string }) => ts.section_id);

      if (courseId) {
        const course = await prisma.course.findUnique({ where: { course_id: courseId }, select: { section_id: true } });
        if (!course?.section_id || !sectionIds.includes(course.section_id)) return forbidden('You do not have access to this course');
        where.course_id = courseId;
      } else if (sectionId) {
        if (!sectionIds.includes(sectionId)) return forbidden('You do not have access to this section');
        where.section_id = sectionId;
      } else {
        where.OR = [
          { section_id: { in: sectionIds } },
          { course: { section_id: { in: sectionIds } } },
        ];
      }
    } else {
      return forbidden();
    }

    const resources = await prisma.resource.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        course: { select: { course_id: true, course_name: true } },
        section: { select: { section_id: true, section_name: true } },
      },
    });

    return ok({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    return serverError();
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) return unauthorized();
    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) return forbidden('Only admins and managers can upload resources');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = (formData.get('title') as string) || '';
    const type = ((formData.get('type') as string) || 'FILE').toUpperCase();
    const linkUrl = (formData.get('url') as string) || '';
    const courseId = (formData.get('course_id') as string) || null;
    const sectionId = (formData.get('section_id') as string) || null;

    if (!VALID_TYPES.includes(type)) return badRequest('Invalid resource type');
    if (!title.trim()) return badRequest('Title is required');
    if (!courseId && !sectionId) return badRequest('A course or section is required');

    if (user.user_role === 'MANAGER') {
      if (sectionId && !(await managerCanAccessSection(user.user_id, sectionId))) {
        return forbidden('You do not manage this section');
      }
      if (courseId) {
        const course = await prisma.course.findUnique({ where: { course_id: courseId }, select: { section_id: true } });
        if (!course?.section_id || !(await managerCanAccessSection(user.user_id, course.section_id))) {
          return forbidden('You do not manage this course');
        }
      }
    }

    let url = linkUrl;
    let mimeType: string | null = null;
    let size: number | null = null;

    if (type === 'LINK') {
      if (!url) return badRequest('A URL is required for LINK resources');
    } else if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const blob = await put(`resources/${user.user_id}/${Date.now()}-${file.name}`, buffer, {
        access: 'public',
        contentType: file.type || 'application/octet-stream',
      });
      url = blob.url;
      mimeType = file.type || null;
      size = file.size;
    } else {
      return badRequest('A file is required for this resource type');
    }

    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        type: type as 'FILE' | 'LINK' | 'IMAGE' | 'VIDEO',
        url,
        mime_type: mimeType,
        size,
        course_id: courseId,
        section_id: sectionId,
        uploaded_by: user.user_id,
      },
    });

    return created({ resource });
  } catch (error) {
    console.error('Create resource error:', error);
    return serverError();
  }
}
