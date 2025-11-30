import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

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

    const representative = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })
    if (!representative || representative.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can view schedules' }, { status: 403 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        section: { manager_id: representative.user_id }
      },
      select: {
        schedule_id: true,
        schedule_date: true,
        course: { select: { course_id: true, course_name: true, verse: true } },
        section: { select: { section_id: true, section_name: true } },
        teacher: { select: { user_id: true, first_name: true, last_name: true, phone_number: true } }
      }
    })

    // Map response to match expected frontend format if needed
    const mappedSchedules = schedules.map(s => ({
      ...s,
      id: s.schedule_id,
      date: s.schedule_date,
      course: { ...s.course, id: s.course.course_id },
      section: { ...s.section, id: s.section.section_id },
      teacher: { ...s.teacher, id: s.teacher.user_id }
    }))

    return NextResponse.json({ schedules: mappedSchedules }, { status: 200 })
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

    const representative = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })
    if (!representative || representative.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can create schedules' }, { status: 403 })
    }

    const { date, course_id, section_id, teacher_id } = await request.json()
    if (!date || !teacher_id) {
      return NextResponse.json({ error: 'Date and teacher are required' }, { status: 400 })
    }

    // Validate teacher belongs to representative's section
    // Since schema uses N:M, we check TeacherSection
    const teacherSection = await prisma.teacherSection.findFirst({
      where: {
        teacher_id: teacher_id,
        section: { manager_id: representative.user_id }
      },
      include: { section: true }
    })

    if (!teacherSection) {
      // Fallback: check if teacher is directly assigned to a section managed by rep (if 1:1 was intended but schema says N:M)
      // For now, assume TeacherSection is the source of truth for "teacher's section"
      return NextResponse.json({ error: 'Teacher not in your managed section' }, { status: 403 })
    }

    const sectionId = teacherSection.section_id

    // Validate section_id (if provided)
    if (section_id && section_id !== sectionId) {
      return NextResponse.json({ error: 'Section must match teacher’s assigned section' }, { status: 400 })
    }

    // Validate course_id (if provided)
    if (course_id) {
      const course = await prisma.course.findUnique({
        where: { course_id }
      })
      if (!course) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
      }
    }

    const schedule = await prisma.schedule.create({
      data: {
        schedule_date: new Date(date),
        course_id,
        section_id: sectionId, // Use teacher’s section
        teacher_id
      }
    })

    return NextResponse.json({ schedule: { ...schedule, id: schedule.schedule_id, date: schedule.schedule_date } }, { status: 201 })
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

    const representative = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })
    if (!representative || representative.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can update schedules' }, { status: 403 })
    }

    const { id, date, course_id, section_id, teacher_id } = await request.json()
    if (!id || !date || !teacher_id) {
      return NextResponse.json({ error: 'Schedule ID, date, and teacher are required' }, { status: 400 })
    }

    // Validate schedule belongs to representative
    const schedule = await prisma.schedule.findUnique({
      where: { schedule_id: id },
      select: { section: { select: { manager_id: true } } }
    })
    if (!schedule || schedule.section?.manager_id !== representative.user_id) {
      return NextResponse.json({ error: 'Unauthorized: Schedule not in your managed section' }, { status: 403 })
    }

    // Validate teacher belongs to representative's section
    const teacherSection = await prisma.teacherSection.findFirst({
      where: {
        teacher_id: teacher_id,
        section: { manager_id: representative.user_id }
      },
      include: { section: true }
    })

    if (!teacherSection) {
      return NextResponse.json({ error: 'Teacher not in your managed section' }, { status: 403 })
    }
    const sectionId = teacherSection.section_id

    // Validate section_id (if provided)
    if (section_id && section_id !== sectionId) {
      return NextResponse.json({ error: 'Section must match teacher’s assigned section' }, { status: 400 })
    }

    // Validate course_id (if provided)
    if (course_id) {
      const course = await prisma.course.findUnique({
        where: { course_id }
      })
      if (!course) {
        return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 })
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { schedule_id: id },
      data: {
        schedule_date: new Date(date),
        course_id,
        section_id: sectionId,
        teacher_id
      }
    })

    return NextResponse.json({ schedule: { ...updatedSchedule, id: updatedSchedule.schedule_id, date: updatedSchedule.schedule_date } }, { status: 200 })
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

    const representative = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })
    if (!representative || representative.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized: Only class representatives can delete schedules' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    const schedule = await prisma.schedule.findUnique({
      where: { schedule_id: id },
      select: { section: { select: { manager_id: true } } }
    })
    if (!schedule || schedule.section?.manager_id !== representative.user_id) {
      return NextResponse.json({ error: 'Unauthorized: Schedule not in your managed section' }, { status: 403 })
    }

    await prisma.schedule.delete({
      where: { schedule_id: id }
    })

    return NextResponse.json({ message: 'Schedule deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
