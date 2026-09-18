import { NextRequest, NextResponse } from 'next/server'
import { formatDate } from 'date-fns'
import prisma from '@/lib/prisma'
import { getRequestUser } from '@/utils/request-auth'

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
    const user = await getRequestUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const schedules = await prisma.schedule.findMany({
      where: { teacher_id: user.user_id, schedule_date: { gte: new Date() } },
      include: {
        course: true,
        section: true
      },
      orderBy: { schedule_date: 'asc' }
    })

    const formattedSchedules = schedules.map((schedule) => ({
      id: schedule.schedule_id,
      date: formatDate(new Date(schedule.schedule_date), 'MMM dd, yyyy'),
      course: {
        id: schedule.course.course_id,
        course_name: schedule.course.course_name,
        verse: schedule.course.verse
      },
      section: {
        id: schedule.section.section_id,
        section_name: schedule.section.section_name
      }
    }))

    return NextResponse.json({ schedules: formattedSchedules }, { status: 200 })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
