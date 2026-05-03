
import prisma from '@/models/client';
import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from '@/utils/data-access';

async function managerCanAccessTeacher(managerId: string, teacherId: string) {
  const [managerSections, directSections, teacherSections] = await Promise.all([
    prisma.managerSection.findMany({ where: { manager_id: managerId }, select: { section_id: true } }),
    prisma.section.findMany({ where: { manager_id: managerId }, select: { section_id: true } }),
    prisma.teacherSection.findMany({ where: { teacher_id: teacherId }, select: { section_id: true } }),
  ]);

  const managed = new Set([
    ...managerSections.map((m) => m.section_id),
    ...directSections.map((s) => s.section_id),
  ]);

  return teacherSections.some((ts) => managed.has(ts.section_id));
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserRole(request);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { id } = await params;
    const target = await prisma.user.findUnique({
      where: { user_id: id },
      include: {
        teacher_sections: {
          include: {
            section: {
              select: { section_id: true, section_name: true }
            }
          }
        }
      }
    });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.user_role === 'ADMIN') {
      return NextResponse.json(target, { status: 200 });
    }

    if (user.user_role === 'MANAGER' && target.user_role === 'TEACHER') {
      const allowed = await managerCanAccessTeacher(user.user_id, target.user_id);
      if (!allowed) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      return NextResponse.json(target, { status: 200 });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (user.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No data provided for update' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: id },
      data: body,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user:', error);

    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {

  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    // Authorization Check
    if (user.user_role !== 'ADMIN') {
      if (user.user_role === 'MANAGER') {
        const target = await prisma.user.findUnique({ where: { user_id: id } });
        
        if (!target) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Managers can only delete teachers
        if (target.user_role !== 'TEACHER') {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Managers can only delete teachers in their managed sections
        const allowed = await managerCanAccessTeacher(user.user_id, id);
        if (!allowed) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
      } else {
        // Other roles (e.g., TEACHER) cannot delete users
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    await prisma.user.delete({
      where: { user_id: id },
    });

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {

    console.error('Error deleting user:', error);

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }

}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserRole(request);

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();

  try {
    const target = await prisma.user.findUnique({ where: { user_id: id } });
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.user_role === 'MANAGER') {
      if (target.user_role !== 'TEACHER') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      const allowed = await managerCanAccessTeacher(user.user_id, id);
      if (!allowed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const { sectionIds, ...userData } = body;

    const updated = await prisma.user.update({
      where: { user_id: id },
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        tg_username: userData.tg_username?.replace(/^@/, '').trim(),
      }
    });

    if (sectionIds !== undefined) {
      if (target.user_role === 'MANAGER') {
        await prisma.managerSection.deleteMany({
          where: { manager_id: id }
        });

        if (sectionIds.length > 0) {
          await prisma.managerSection.createMany({
            data: sectionIds.map((sectionId: string) => ({
              manager_id: id,
              section_id: sectionId,
            })),
          });
        }
      } else {
        await prisma.teacherSection.deleteMany({
          where: { teacher_id: id }
        });

        if (sectionIds.length > 0) {
          await prisma.teacherSection.createMany({
            data: sectionIds.map((sectionId: string) => ({
              teacher_id: id,
              section_id: sectionId,
            })),
          });
        }
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
