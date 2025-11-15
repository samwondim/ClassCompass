import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { formatDate } from 'date-fns'

const prisma = new PrismaClient()

interface Schedule {
  id: number
  date: string
  course: {
    id: number
    course_name: string
    verse: string | null
  }
  section: {
    id: number
    section_name: string | null
  }
}

export async function GET(request: NextRequest) {
  try {
    const phoneNumber = request.headers.get('x-phone-number')
    if (!phoneNumber) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const teacher = await prisma.teacher.findUnique({
      where: { phone_number: phoneNumber },
      select: { id: true }
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const schedules = await prisma.schedule.findMany({
      where: { teacher_id: teacher.id },
      include: {
        course: true,
        section: true
      },
      orderBy: { date: 'asc' }
    })

    const formattedSchedules = schedules.map((schedule) => ({
      id: schedule.id,
      date: formatDate(new Date(schedule.date), 'MMM dd, yyyy'),
      course: {
        id: schedule.course.id,
        course_name: schedule.course.course_name,
        verse: schedule.course.verse
      },
      section: {
        id: schedule.section.id,
        section_name: schedule.section.section_name
      }
    }))

    return NextResponse.json({ schedules: formattedSchedules }, { status: 200 })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
