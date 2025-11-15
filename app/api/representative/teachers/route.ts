import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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

    const representative = await prisma.teacher.findUnique({
      where: { phone_number: phoneNumber },
      select: { id: true, is_class_rep: true, first_name: true, last_name: true }
    })
    if (!representative || !representative.is_class_rep) {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can view teachers' }, { status: 403 })
    }

    const managedSections = await prisma.section.findMany({
      where: { class_rep_id: representative.id },
      select: { id: true }
    })
    const sectionIds = managedSections.map(section => section.id)

    // Fetch teachers assigned to those sections
    const teachers = await prisma.teacher.findMany({
      where: {
        section_id: { in: sectionIds },
        id: { not: representative.id } // Exclude the representative's ID
      },
      include: {
        _count: { select: { schedules: true } }
      }
    })

    return NextResponse.json({
      teachers,
      representative: {
        id: representative.id,
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

    const representative = await prisma.teacher.findUnique({
      where: { phone_number: phoneNumber },
      select: { id: true, is_class_rep: true }
    })
    if (!representative || !representative.is_class_rep) {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can assign teachers' }, { status: 403 })
    }

    const { teacher_id } = await request.json()
    if (!teacher_id) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacher_id }
    })
    if (!teacher || teacher.is_class_rep) {
      return NextResponse.json({ error: 'Invalid teacher or teacher is a class rep' }, { status: 400 })
    }

    // Check if teacher is already assigned
    const isAssigned = await prisma.teacher.findFirst({
      where: { id: teacher_id, class_rep_id: representative.id }
    })
    if (isAssigned) {
      return NextResponse.json({ error: 'Teacher is already assigned to you' }, { status: 400 })
    }

    await prisma.teacher.update({
      where: { id: teacher_id },
      data: { class_rep_id: representative.id }
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

    const representative = await prisma.teacher.findUnique({
      where: { phone_number: phoneNumber },
      select: { id: true, is_class_rep: true }
    })
    if (!representative || !representative.is_class_rep) {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can remove teachers' }, { status: 403 })
    }

    const { teacher_id } = await request.json()
    if (!teacher_id) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacher_id }
    })
    if (!teacher || teacher.class_rep_id !== representative.id) {
      return NextResponse.json({ error: 'Teacher not assigned to you or invalid' }, { status: 400 })
    }

    await prisma.teacher.update({
      where: { id: teacher_id },
      data: { class_rep_id: null }
    })

    return NextResponse.json({ message: 'Teacher removed successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error removing teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
