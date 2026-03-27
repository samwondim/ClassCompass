import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'


// GET /api/representative/sections - Get sections assigned to this representative
export async function GET(request: NextRequest) {
  try {
    const phoneNumber = request.headers.get('x-phone-number')
    if (!phoneNumber) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const currentTeacher = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })

    if (!currentTeacher || currentTeacher.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Unauthorized - Class representative access required' }, { status: 401 })
    }

    // Get sections assigned to this representative
    const sections = await prisma.section.findMany({
      where: {
        manager_id: currentTeacher.user_id
      },
      select: {
        section_id: true,
        section_name: true,
        _count: {
          select: {
            schedules: true
          }
        }
      },
      orderBy: {
        section_name: 'asc'
      }
    })

    const mappedSections = sections.map(s => ({
      ...s,
      id: s.section_id // Map section_id to id for frontend
    }))

    return NextResponse.json({ sections: mappedSections })
  } catch (error) {
    console.error('Get representative sections error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/representative/sections - Assign section to this representative (manager only)
export async function POST(request: NextRequest) {
  try {
    const phoneNumber = request.headers.get('x-phone-number')
    if (!phoneNumber) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const currentTeacher = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })

    if (!currentTeacher || currentTeacher.user_role !== 'ADMIN') { // Assuming only ADMIN can assign sections to managers
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { section_id, class_rep_id } = await request.json()

    if (!section_id || !class_rep_id) {
      return NextResponse.json({ error: 'Section ID and class representative ID are required' }, { status: 400 })
    }

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { section_id: section_id }
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Check if class representative exists and is actually a class rep
    const classRep = await prisma.user.findUnique({
      where: { user_id: class_rep_id }
    })

    if (!classRep || classRep.user_role !== 'MANAGER') {
      return NextResponse.json({ error: 'Class representative not found or invalid' }, { status: 404 })
    }

    // Assign section to class representative
    const updatedSection = await prisma.section.update({
      where: { section_id: section_id },
      data: {
        manager_id: class_rep_id
      },
      select: {
        section_id: true,
        section_name: true,
        manager: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    })

    return NextResponse.json({ section: { ...updatedSection, id: updatedSection.section_id } })
  } catch (error) {
    console.error('Assign section error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/representative/sections - Remove section from class representative (manager only)
export async function DELETE(request: NextRequest) {
  try {
    const phoneNumber = request.headers.get('x-phone-number')
    if (!phoneNumber) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    const currentTeacher = await prisma.user.findUnique({
      where: { phone_number: phoneNumber },
      select: { user_id: true, user_role: true }
    })

    if (!currentTeacher || currentTeacher.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const { section_id } = await request.json()

    if (!section_id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    // Check if section exists
    const section = await prisma.section.findUnique({
      where: { section_id: section_id }
    })

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 })
    }

    // Remove section from class representative
    await prisma.section.update({
      where: { section_id: section_id },
      data: {
        manager_id: null
      }
    })

    return NextResponse.json({ message: 'Section removed from class representative successfully' })
  } catch (error) {
    console.error('Remove section error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
