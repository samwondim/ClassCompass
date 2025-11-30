import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface Teacher {
  id: number
  first_name: string
  last_name: string | null
  phone_number: string
  telegram_id: string | null
  is_manager: boolean
  is_class_rep: boolean
  _count: {
    schedules: number
  }
}

export async function GET(request: NextRequest) {
  try {
    const phoneNumber = request.headers.get('x-phone-number')
    if (!phoneNumber) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const representative = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true, first_name: true, last_name: true }
    })
    if (!representative || representative.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can view teachers' }, { status: 403 })
    }

    const managedSections = await prisma.section.findMany({
      where: { manager_id: representative.user_id },
      select: { section_id: true }
    })
    const sectionIds = managedSections.map(section => section.section_id)

    // Fetch teachers assigned to those sections
    const teacherSections = await prisma.teacherSection.findMany({
      where: {
        section_id: { in: sectionIds },
        teacher_id: { not: representative.user_id }
      },
      include: {
        teacher: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            phone_number: true,
            tg_id: true,
            user_role: true,
            _count: { select: { schedules: true } }
          }
        }
      }
    })

    const teachers = teacherSections.map(ts => ({
      ...ts.teacher,
      id: ts.teacher.user_id, // Map user_id to id for frontend
      telegram_id: ts.teacher.tg_id?.toString() || null,
      is_manager: ts.teacher.user_role === 'MANAGER',
      is_class_rep: ts.teacher.user_role === 'MANAGER' // Assuming manager = class rep
    }))

    // Remove duplicates if a teacher is in multiple sections managed by same rep
    const uniqueTeachers = Array.from(new Map(teachers.map(t => [t.id, t])).values())

    return NextResponse.json({
      teachers: uniqueTeachers,
      representative: {
        id: representative.user_id,
        name: `${representative.first_name} ${representative.last_name || ''}`.trim()
      }
    }, { status: 200 })
  } catch (error) {
    console.error('Error fetching teachers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    const phoneNumber = request.headers.get('x-phone-number')
    if (!phoneNumber) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const representative = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })
    if (!representative || representative.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can assign teachers' }, { status: 403 })
    }

    const { teacher_id } = await request.json()
    if (!teacher_id) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const teacher = await prisma.user.findUnique({
      where: { user_id: teacher_id }
    })
    if (!teacher || teacher.user_role === 'MANAGER') {
      return NextResponse.json({ error: 'Invalid teacher or teacher is a manager' }, { status: 400 })
    }

    // Get a section managed by the representative
    const section = await prisma.section.findFirst({
      where: { manager_id: representative.user_id }
    })

    if (!section) {
      return NextResponse.json({ error: 'You do not manage any section' }, { status: 400 })
    }

    // Check if teacher is already assigned to this section
    const isAssigned = await prisma.teacherSection.findUnique({
      where: {
        teacher_id_section_id: {
          teacher_id: teacher_id,
          section_id: section.section_id
        }
      }
    })
    if (isAssigned) {
      return NextResponse.json({ error: 'Teacher is already assigned to your section' }, { status: 400 })
    }

    await prisma.teacherSection.create({
      data: {
        teacher_id: teacher_id,
        section_id: section.section_id
      }
    })

    return NextResponse.json({ message: 'Teacher assigned successfully' }, { status: 201 })
  } catch (error) {
    console.error('Error assigning teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const phoneNumber = request.headers.get('x-phone-number')
    if (!phoneNumber) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const representative = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })
    if (!representative || representative.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can remove teachers' }, { status: 403 })
    }

    const { teacher_id } = await request.json()
    if (!teacher_id) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    // Find the teacher section record
    const teacherSection = await prisma.teacherSection.findFirst({
      where: {
        teacher_id: teacher_id,
        section: { manager_id: representative.user_id }
      }
    })

    if (!teacherSection) {
      return NextResponse.json({ error: 'Teacher not assigned to your section' }, { status: 400 })
    }

    await prisma.teacherSection.delete({
      where: { id: teacherSection.id }
    })

    return NextResponse.json({ message: 'Teacher removed successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error removing teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
