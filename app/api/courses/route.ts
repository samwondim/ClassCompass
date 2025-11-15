import { NextRequest, NextResponse } from 'next/server'
import { authenticateByPhone } from '@/lib/phone-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET /api/courses - Get all courses
export async function GET(request: NextRequest) {
  try {
    const currentTeacher = await authenticateByPhone(request)
    
    if (!currentTeacher) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const courses = await prisma.course.findMany({
      orderBy: {
        course_name: 'asc'
      }
    })

    return NextResponse.json({ courses })
  } catch (error) {
    console.error('Get courses error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/courses - Create new course
export async function POST(request: NextRequest) {
  try {
    const currentTeacher = await authenticateByPhone(request)
    
    if (!currentTeacher || (!currentTeacher.is_manager && !currentTeacher.is_class_rep)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { course_name, verse } = await request.json()

    if (!course_name) {
      return NextResponse.json({ error: 'Course name is required' }, { status: 400 })
    }

    const course = await prisma.course.create({
      data: {
        course_name,
        verse: verse || null
      }
    })

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Create course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/courses - Update a course
export async function PUT(request: NextRequest) {
  try {
    const currentTeacher = await authenticateByPhone(request)
    
    if (!currentTeacher || (!currentTeacher.is_manager && !currentTeacher.is_class_rep)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, course_name, verse } = await request.json()

    if (!id || !course_name) {
      return NextResponse.json({ error: 'Course ID and name are required' }, { status: 400 })
    }

    const updatedCourse = await prisma.course.update({
      where: { id: Number(id) },
      data: {
        course_name,
        verse: verse || null
      }
    })

    return NextResponse.json({ course: updatedCourse })
  } catch (error) {
    console.error('Update course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/courses - Delete a course
export async function DELETE(request: NextRequest) {
  try {
    const currentTeacher = await authenticateByPhone(request)
    
    if (!currentTeacher || (!currentTeacher.is_manager && !currentTeacher.is_class_rep)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 })
    }

    await prisma.course.delete({
      where: { id: Number(id) }
    })

    return NextResponse.json({ message: 'Course deleted successfully' })
  } catch (error) {
    console.error('Delete course error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}