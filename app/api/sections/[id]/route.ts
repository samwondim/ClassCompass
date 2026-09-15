import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from '@/utils/data-access';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (user.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    const section = await prisma.section.findUnique({ where: { section_id: id } });
    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    await prisma.section.delete({ where: { section_id: id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete section error:', error);
    return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
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
    const sectionName = body.section_name?.trim();

    if (!sectionName || sectionName.length < 2 || sectionName.length > 100) {
      return NextResponse.json({ error: 'Section name must be between 2 and 100 characters' }, { status: 400 });
    }

    const section = await prisma.section.update({
      where: { section_id: id },
      data: { section_name: sectionName },
    });

    return NextResponse.json({ section });
  } catch (error) {
    console.error('Update section error:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}
