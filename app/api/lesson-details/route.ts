
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/utils/session'

interface Lesson {
  course: string
  date: string
  time?: string | null
  verse?: string | null
  section?: string | null
  topic?: string | null
  description?: string | null
  objectives: string[]
  materials: string[]
  schedule: { time: string; activity: string }[]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    const user = session?.fetched_user

    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }
    if (user.user_role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const teacher = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      select: { user_id: true }
    })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Fetch the next upcoming schedule for the teacher
    const schedule = await prisma.schedule.findFirst({
      where: { teacher_id: teacher.user_id, schedule_date: { gte: new Date() } },
      include: {
        course: { select: { course_name: true, verse: true, course_description: true, objectives: true } },
        section: { select: { section_name: true } }
      },
      orderBy: { schedule_date: 'asc' }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'No upcoming lessons found' }, { status: 404 })
    }

    const courseName = schedule.course.course_name || schedule.course.course_description || 'Upcoming Lesson'

    const objectives = schedule.course.objectives?.map(obj => obj.objective).filter(Boolean) || []

    // Construct lesson details based on available data
    const lesson: Lesson = {
      course: courseName,
      date: new Date(schedule.schedule_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      time: null,
      verse: schedule.course.verse || null,
      section: schedule.section.section_name || null,
      topic: null,
      description: schedule.course.course_description || null,
      objectives,
      materials: [],
      schedule: []
    }

    return NextResponse.json({ lesson }, { status: 200 })
  } catch (error) {
    console.error('Error fetching lesson details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
