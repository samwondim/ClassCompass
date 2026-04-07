import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/models/client';
import { getUserRole } from '@/utils/data-access';

// GET /api/teachers - Get all teachers (manager only)
export async function GET(request: NextRequest) {
  try {

    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!["MANAGER", "ADMIN"].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    const { searchParams } = new URL(request.url);
    const sectionId = searchParams.get('sectionId');

    const whereClause: any = {};
    if (sectionId) {
        whereClause.section_id = sectionId;
    }

    const teacherSections = await prisma.teacherSection.findMany({
        where: whereClause,
        include: {
        teacher: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            tg_username: true,
          },
        },
        section: {
          select: {
            section_id: true,
            section_name: true,
          },
        },
      },
    })

    return NextResponse.json({ teachers: teacherSections });
  } catch (error) {
    console.error('Get teachers error:', error)
    // Log the full error object for better debugging
    // console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/teachers - Create new teacher (manager, and admin only)
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!["MANAGER", "ADMIN"].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized: Only managers and admins can create teachers' }, { status: 403 });
    }

    const { first_name, last_name, phone_number, user_role, tg_username, section_id } = await request.json()

    if (!first_name || !phone_number || !section_id) {
      return NextResponse.json({ error: 'First name, phone number, and section are required' }, { status: 400 })
    }

    if (!tg_username) {
      return NextResponse.json({ error: 'Telegram Username is required' }, { status: 400 })
    }

    // CRITICAL: Validate that the manager owns this section
    if (user.user_role === 'MANAGER') {
      const managerOwnsSection = await prisma.managerSection.findFirst({
        where: {
          manager_id: user.user_id,
          section_id: section_id
        }
      });

      if (!managerOwnsSection) {
        return NextResponse.json({
          error: 'Unauthorized: You can only add teachers to sections you manage'
        }, { status: 403 });
      }
    }

    // Sanitize and validate input
    const sanitizedFirstName = first_name.trim()
    const sanitizedtgUsername = tg_username.trim()
    const sanitizedLastName = last_name ? last_name.trim() : null
    const sanitizedPhone = phone_number.trim().replace(/\s/g, '')

    if (sanitizedFirstName.length < 2 || sanitizedFirstName.length > 100) {
      return NextResponse.json({ error: 'First name must be between 2 and 100 characters' }, { status: 400 })
    }

    // Check if teacher with this telegram username already exists
    const existingTeacher = await prisma.teacherSection.findFirst({
      where: {
        teacher: {
          tg_username: sanitizedtgUsername,
        },
      },
      include: {
        teacher: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            tg_username: true,
          },
        },
        section: {
          select: {
            section_id: true,
            section_name: true,
          },
        },
      },
    })

    if (existingTeacher) {
      return NextResponse.json({ error: `Teacher with name ${existingTeacher.teacher.first_name} ${existingTeacher.teacher.last_name} already exists` }, { status: 409 })
    }

    // Validate section_id
    const section = await prisma.section.findUnique({
      where: { section_id: section_id }
    });
    if (!section) {
      return NextResponse.json({ error: 'Invalid section ID' }, { status: 400 })
    }

    const teacher = await prisma.teacherSection.create({
      data: {
        teacher: {
          create: {
            first_name: sanitizedFirstName,
            last_name: sanitizedLastName,
            phone_number: sanitizedPhone,
            tg_username: sanitizedtgUsername,
            user_role: "TEACHER"
          }
        },
        section: {
          connect: { section_id: section_id }
        }
      }
    })

    return NextResponse.json({ teacher }, { status: 201 })
  } catch (error) {
    console.error('Create teacher error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/teachers - Update teacher phone number
export async function PUT(request: NextRequest) {
  try {

    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!["MANAGER", "ADMIN"].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { teacher_id, phone_number } = await request.json()

    if (!teacher_id || !phone_number) {
      return NextResponse.json({ error: 'teacher id and phone number are required' }, { status: 400 })
    }

    if (user.user_role === 'MANAGER') {
      const managerSections = await prisma.managerSection.findMany({
        where: { manager_id: user.user_id },
        select: { section_id: true }
      });
      const managedSectionIds = managerSections.map(ms => ms.section_id);
      const teacherSections = await prisma.teacherSection.findMany({
        where: { teacher_id },
        select: { section_id: true }
      });
      const teacherSectionIds = teacherSections.map(ts => ts.section_id);
      const allowed = teacherSectionIds.some(id => managedSectionIds.includes(id));
      if (!allowed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Check if phone number already exists for another user
    const existingPhone = await prisma.user.findFirst({
      where: {
        phone_number: phone_number,
        NOT: { user_id: teacher_id },
      }
    })

    if (existingPhone) {
      return NextResponse.json({ error: 'This phone number is already in use' }, { status: 409 })
    }

    const updatedTeacher = await prisma.user.update({
      where: { user_id: teacher_id },
      data: { phone_number }
    })

    return NextResponse.json({ teacher: updatedTeacher })
  } catch (error) {
    console.error('Update teacher error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (!["MANAGER", "ADMIN"].includes(user.user_role || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await request.json()
    console.log("Teacher ID:", id)

    if (!id) {
      return NextResponse.json({ error: 'Teacher ID is required' }, { status: 400 })
    }

    const teacher = await prisma.user.findUnique({ where: { user_id: id } })
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (user.user_role === 'MANAGER') {
      const managerSections = await prisma.managerSection.findMany({
        where: { manager_id: user.user_id },
        select: { section_id: true }
      });
      const managedSectionIds = managerSections.map(ms => ms.section_id);
      const teacherSections = await prisma.teacherSection.findMany({
        where: { teacher_id: id },
        select: { section_id: true }
      });
      const teacherSectionIds = teacherSections.map(ts => ts.section_id);
      const allowed = teacherSectionIds.some(sectionId => managedSectionIds.includes(sectionId));
      if (!allowed) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }


    await prisma.user.delete({
      where: { user_id: id }
    })

    return NextResponse.json({ message: 'Teacher deleted successfully' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
