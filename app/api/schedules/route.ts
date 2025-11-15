import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramWebAppData } from '@/lib/telegram-auth'
import { authenticateByPhone } from '@/lib/phone-auth'

import { PrismaClient } from '@/generated/prisma'
import { cookies } from "next/headers";
import { getSession, getUserRole } from '@/utils/session';
import prisma from '@/models/client';

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


// GET /api/schedules - Get teacher's schedules
export async function GET(request: NextRequest) {
  try {
    const teacher = await getUserRole();

    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        teacher_id: teacher.user_id
      },
      include: {
        course: true,
      },
      orderBy: {
        schedule_date: 'asc'
      }
    })

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error('Get schedules error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/schedules - Create new schedule (manager or class rep)
export async function POST(request: NextRequest) {
  try {
    const teacher = await authenticateRequest(request)

    if (!teacher || (!teacher.is_manager && !teacher.is_class_rep)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { date, course_id, section_id, teacher_id } = await request.json()

    if (!date || !teacher_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const schedule = await prisma.schedule.create({
      data: {
        date: new Date(date),
        course_id: course_id || null,
        section_id: section_id || null,
        teacher_id: parseInt(teacher_id)
      },
      include: {
        course: true,
        section: true,
        teacher: true
      }
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    console.error('Create schedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/schedules - Update schedule (manager or class rep)
export async function PUT(request: NextRequest) {
  try {
    const teacher = await authenticateRequest(request)

    if (!teacher || (!teacher.is_manager && !teacher.is_class_rep)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, date, course_id, section_id, teacher_id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) }
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // If class rep, check if they have permission to modify this schedule
    if (teacher.is_class_rep && !teacher.is_manager) {
      // Check if the schedule belongs to a teacher or section assigned to this representative
      const scheduleWithRelations = await prisma.schedule.findUnique({
        where: { id: parseInt(id) },
        include: {
          teacher: true,
          section: true
        }
      })

      if (!scheduleWithRelations) {
        return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
      }

      const isTeacherAssigned = scheduleWithRelations.teacher?.class_rep_id === teacher.id
      const isSectionAssigned = scheduleWithRelations.section?.class_rep_id === teacher.id

      if (!isTeacherAssigned && !isSectionAssigned) {
        return NextResponse.json({ error: 'You can only modify schedules for your assigned teachers/sections' }, { status: 403 })
      }
    }

    const updatedSchedule = await prisma.schedule.update({
      where: { id: parseInt(id) },
      data: {
        ...(date && { date: new Date(date) }),
        ...(course_id !== undefined && { course_id: course_id ? parseInt(course_id) : null }),
        ...(section_id !== undefined && { section_id: section_id ? parseInt(section_id) : null }),
        ...(teacher_id && { teacher_id: parseInt(teacher_id) })
      },
      include: {
        course: true,
        section: true,
        teacher: true
      }
    })

    return NextResponse.json({ schedule: updatedSchedule })
  } catch (error) {
    console.error('Update schedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/schedules - Delete schedule (manager or class rep)
export async function DELETE(request: NextRequest) {
  try {
    const teacher = await authenticateRequest(request)

    if (!teacher || (!teacher.is_manager && !teacher.is_class_rep)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Schedule ID is required' }, { status: 400 })
    }

    // Check if schedule exists
    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: parseInt(id) },
      include: {
        teacher: true,
        section: true
      }
    })

    if (!existingSchedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 })
    }

    // If class rep, check if they have permission to delete this schedule
    if (teacher.is_class_rep && !teacher.is_manager) {
      const isTeacherAssigned = existingSchedule.teacher?.class_rep_id === teacher.id
      const isSectionAssigned = existingSchedule.section?.class_rep_id === teacher.id

      if (!isTeacherAssigned && !isSectionAssigned) {
        return NextResponse.json({ error: 'You can only delete schedules for your assigned teachers/sections' }, { status: 403 })
      }
    }

    await prisma.schedule.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'Schedule deleted successfully' })
  } catch (error) {
    console.error('Delete schedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
