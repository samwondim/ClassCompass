import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from '@/utils/data-access';

// GET /api/sections - Get sections (admin sees all, manager sees their own)
export async function GET(request: NextRequest) {
  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!['ADMIN', 'MANAGER'].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const whereClause: any = {};

    if (user.user_role === 'MANAGER') {
      const [managerSections, directSections] = await Promise.all([
        prisma.managerSection.findMany({ where: { manager_id: user.user_id }, select: { section_id: true } }),
        prisma.section.findMany({ where: { manager_id: user.user_id }, select: { section_id: true } }),
      ]);
      const sectionIds = [
        ...managerSections.map(ms => ms.section_id),
        ...directSections.map(s => s.section_id),
      ];
      whereClause.section_id = { in: sectionIds };
    }

    const sections = await prisma.section.findMany({
      where: whereClause,
      select: {
        section_id: true,
        section_name: true,
        manager: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
          }
        },
      },
      orderBy: {
        section_name: 'asc'
      }
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error('Get sections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/sections - Create new section (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (user.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Only admins can create sections' }, { status: 403 });
    }

    const { section_name } = await request.json();

    if (!section_name || typeof section_name !== 'string') {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 });
    }

    // Sanitize and validate input
    const sanitizedSectionName: string = section_name.trim();

    if (sanitizedSectionName.length < 2 || sanitizedSectionName.length > 100) {
      return NextResponse.json({ error: 'Section name must be between 2 and 100 characters' }, { status: 400 });
    }

    // Check if section already exists (case-insensitive)
    const existingSection = await prisma.section.findFirst({
      where: { section_name: { equals: sanitizedSectionName, mode: 'insensitive' } }
    });

    if (existingSection) {
      return NextResponse.json({ error: 'Section with this name already exists' }, { status: 409 });
    }

    const section = await prisma.section.create({
      data: {
        section_name: sanitizedSectionName
      }
    });

    return NextResponse.json({ section }, { status: 201 });
  } catch (error) {
    console.error('Create section error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
