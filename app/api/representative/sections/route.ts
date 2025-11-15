import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramWebAppData } from '@/lib/telegram-auth'
import { PrismaClient } from '@prisma/client'
import { authenticateByPhone } from '@/lib/phone-auth'

const prisma = new PrismaClient()

async function authenticateRequest(request: NextRequest) {
  const currentTeacher = await authenticateByPhone(request)

  const botToken = process.env.BOT_TOKEN
  console.log('authenticateRequest - BOT_TOKEN present:', !!botToken)
  if (!botToken) {
    console.log('authenticateRequest - BOT_TOKEN not set')
    return null
  }

  return currentTeacher;
}


// GET /api/representative/sections - Get sections assigned to this representative
export async function GET(request: NextRequest) {
  try {
    const currentTeacher = await authenticateRequest(request)

    if (!currentTeacher || !currentTeacher.is_class_rep) {
      return NextResponse.json({ error: 'Unauthorized - Class representative access required' }, { status: 401 })
    }

    // Get sections assigned to this representative
    const sections = await prisma.section.findMany({
      where: {
        class_rep_id: currentTeacher.id
      },
      select: {
        id: true,
        section_name: true,
        _count: {
          select: {
            schedules: true
          }
        }
      },
      orderBy: {
        section_name: 'asc'
      }
    })

    return NextResponse.json({ sections })
  } catch (error) {
    console.error('Get representative sections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/representative/sections - Assign section to this representative (manager only)
export async function POST(request: NextRequest) {
  try {
    const currentTeacher = await authenticateRequest(request)

    if (!currentTeacher || !currentTeacher.is_manager) {
      return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 401 })
    }

    const { section_id, class_rep_id } = await request.json()

    if (!section_id || !class_rep_id) {
      return NextResponse.json({ error: 'Section ID and class representative ID are required' }, { status: 400 })
    }

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: parseInt(section_id) }
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Check if class representative exists and is actually a class rep
    const classRep = await prisma.teacher.findUnique({
      where: { id: parseInt(class_rep_id) }
    })

    if (!classRep || !classRep.is_class_rep) {
      return NextResponse.json({ error: 'Class representative not found or invalid' }, { status: 404 })
    }

    // Assign section to class representative
    const updatedSection = await prisma.section.update({
      where: { id: parseInt(section_id) },
      data: {
        class_rep_id: parseInt(class_rep_id)
      },
      select: {
        id: true,
        section_name: true,
        class_rep: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    })

    return NextResponse.json({ section: updatedSection })
  } catch (error) {
    console.error('Assign section error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/representative/sections - Remove section from class representative (manager only)
export async function DELETE(request: NextRequest) {
  try {
    const currentTeacher = await authenticateRequest(request)

    if (!currentTeacher || !currentTeacher.is_manager) {
      return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 401 })
    }

    const { section_id } = await request.json()

    if (!section_id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { id: parseInt(section_id) }
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Remove section from class representative
    await prisma.section.update({
      where: { id: parseInt(section_id) },
      data: {
        class_rep_id: null
      }
    })

    return NextResponse.json({ message: 'Section removed from class representative successfully' })
  } catch (error) {
    console.error('Remove section error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
