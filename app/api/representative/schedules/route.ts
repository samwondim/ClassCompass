import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface Teacher {
  id: number
  first_name: string
  last_name: string | null
  phone_number: string
  is_manager: boolean
  is_class_rep: boolean
}

export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can view schedules' }, { status: 403 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        section: { class_rep_id: representative.id }
      },
      select: {
        id: true,
        date: true,
        course: { select: { id: true, course_name: true, verse: true } },
        section: { select: { id: true, section_name: true } },
        teacher: { select: { id: true, first_name: true, last_name: true, phone_number: true } }
      }
    })

    return NextResponse.json({ schedules }, { status: 200 })
  } catch (error) {
    console.error('Error fetching schedules:', error)
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
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can create schedules' }, { status: 403 })
    }

    const { date, course_id, section_id, teacher_id } = await request.json()
    if (!date || !teacher_id) {
      return NextResponse.json({ error: 'Date and teacher are required' }, { status: 400 })
    }

    // Validate teacher belongs to representative's section
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacher_id },
      select: { section_id: true }
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 })
    }
    const section = await prisma.section.findFirst({
      where: { id: teacher.section_id, class_rep_id: representative.id }
    })
    if (!section) {
      return NextResponse.json({ error: 'Teacher not in your managed section' }, { status: 403 })
    }

    // Validate section_id (if provided)
    if (section_id && section_id !== teacher.section_id) {
      return NextResponse.json({ error: 'Section must match teacher’s assigned section' }, { status: 400 })
    }

    // Validate course_id (if provided)
    if (course_id) {
      const course = await prisma.course.findUnique({
        where: { id: course_id }
      })
      if (!course) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        date: new Date(date),
        course_id,
        section_id: teacher.section_id, // Use teacher’s section
        teacher_id
      }
    })

    return NextResponse.json({ schedule }, { status: 201 })
  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function PUT(request: NextRequest) {
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
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can update schedules' }, { status: 403 })
    }

    const { id, date, course_id, section_id, teacher_id } = await request.json()
    if (!id || !date || !teacher_id) {
      return NextResponse.json({ error: 'Schedule ID, date, and teacher are required' }, { status: 400 })
    }

    // Validate schedule belongs to representative
    const schedule = await prisma.schedule.findUnique({
      where: { id },
      select: { section: { select: { class_rep_id: true } } }
    })
    if (!schedule || schedule.section?.class_rep_id !== representative.id) {
      return NextResponse.json({ error: 'Unauthorized: Schedule not in your managed section' }, { status: 403 })
    }

    // Validate teacher belongs to representative's section
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacher_id },
      select: { section_id: true }
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Invalid teacher ID' }, { status: 400 })
    }
    const section = await prisma.section.findFirst({
      where: { id: teacher.section_id, class_rep_id: representative.id }
    })
    if (!section) {
      return NextResponse.json({ error: 'Teacher not in your managed section' }, { status: 403 })
    }

    // Validate section_id (if provided)
    if (section_id && section_id !== teacher.section_id) {
      return NextResponse.json({ error: 'Section must match teacher’s assigned section' }, { status: 400 })
    }

    // Validate course_id (if provided)
    if (course_id) {
      const course = await prisma.course.findUnique({
        where: { id: course_id }
      })
      if (!course) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id },
      data: {
        date: new Date(date),
        course_id,
        section_id: teacher.section_id,
        teacher_id
      }
    })

    return NextResponse.json({ schedule: updatedSchedule }, { status: 200 })
  } catch (error) {
    console.error('Error updating schedule:', error)
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
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can delete schedules' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id },
      select: { section: { select: { class_rep_id: true } } }
    })
    if (!schedule || schedule.section?.class_rep_id !== representative.id) {
      return NextResponse.json({ error: 'Unauthorized: Schedule not in your managed section' }, { status: 403 })
    }

    await prisma.schedule.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Schedule deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
