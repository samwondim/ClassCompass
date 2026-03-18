
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/utils/session'

interface Lesson {
  course: string
  date: string
  time: string
  verse: string
  section: string
  topic: string
  description: string
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
        course: { select: { course_name: true, verse: true } },
        section: { select: { section_name: true } }
      },
      orderBy: { schedule_date: 'asc' }
    })

    if (!schedule) {
      return NextResponse.json({ error: 'No upcoming lessons found' }, { status: 404 })
    }

    // Construct lesson details (simplified; expand as needed)
    const lesson: Lesson = {
      course: schedule.course.course_name,
      date: new Date(schedule.schedule_date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      time: '10:30 AM - 11:30 AM', // Placeholder; fetch actual time if available
      verse: schedule.course.verse || 'Matthew 5:16',
      section: schedule.section.section_name || 'Room 203',
      topic: 'Let Your Light Shine', // Placeholder; derive from course or add to schema
      description: 'In this lesson, students will learn about being a light in the world and how their actions can reflect God\'s love to others.',
      objectives: [
        'Understand the meaning of ' + (schedule.course.verse || 'Matthew 5:16'),
        'Identify ways to be a light in their homes and schools',
        'Create a craft that represents being a light',
        'Memorize the verse',
      ],
      materials: [
        'Construction paper',
        'Scissors',
        'Glue',
        'Markers',
        'Battery-operated tea lights (one per student)',
        'Printed verse cards',
      ],
      schedule: [
        { time: '10:30 AM', activity: 'Welcome and Opening Prayer' },
        { time: '10:35 AM', activity: 'Review Last Week\'s Lesson' },
        { time: '10:40 AM', activity: 'Bible Story and Discussion' },
        { time: '10:55 AM', activity: 'Memory Verse Activity' },
        { time: '11:05 AM', activity: 'Craft: Paper Lanterns' },
        { time: '11:25 AM', activity: 'Closing Prayer' },
      ]
    }

    return NextResponse.json({ lesson }, { status: 200 })
  } catch (error) {
    console.error('Error fetching lesson details:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
