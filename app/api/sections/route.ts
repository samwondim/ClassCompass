import prisma from '@/models/client';
import { getUserRole } from '@/utils/session';
import { NextRequest, NextResponse } from "next/server";

// GET /api/sections - Get all sections
export async function GET(request: NextRequest) {
  try {

    const sections = await prisma.section.findMany({
      select: {
        section_id: true,
        section_name: true,
        manager: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            tg_username: true
          }
        },
      },
      orderBy: {
        section_name: 'asc'
      }
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Get sections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/sections - Create new section (manager only)
export async function POST(request: NextRequest) {
  try {

    const { section_name } = await request.json()

    if (!section_name) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 })
    }

    // Sanitize and validate input
    const sanitizedSectionName: String = section_name.trim()

    if (sanitizedSectionName.length < 2 || sanitizedSectionName.length > 100) {
      return NextResponse.json({ error: 'Section name must be between 2 and 100 characters' }, { status: 400 })
    }

    // Check if section already exists (case-insensitive)
    const existingSection = await prisma.section.findFirst({
      where: { section_name: { equals: sanitizedSectionName, mode: 'insensitive' } }
    })

    if (existingSection) {
      return NextResponse.json({ error: 'Section with this name already exists' }, { status: 409 })
    }

    const section = await prisma.section.create({
      data: {
        section_name: section_name
      }
    });

    return NextResponse.json({ section })
  } catch (error) {
    console.error('Create section error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
