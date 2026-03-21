import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';
import { getUserRole } from '@/utils/data-access';

/**
 * GET /api/managers/teachers
 * Returns only teachers assigned to sections managed by the authenticated manager
 */
export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getUserRole(request);

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        if (user.user_role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized: Only managers can access this endpoint' }, { status: 403 });
        }

        // Get sections managed by this manager
        const managerSections = await prisma.managerSection.findMany({
            where: {
                manager_id: user.user_id
            },
            select: {
                section_id: true
            }
        });

        const sectionIds = managerSections.map(ms => ms.section_id);

        if (sectionIds.length === 0) {
            return NextResponse.json({ teachers: [], sections: [] }, { status: 200 });
        }

        // Fetch teachers assigned to those sections
        const teacherSections = await prisma.teacherSection.findMany({
            where: {
                section_id: { in: sectionIds }
            },
            include: {
                teacher: {
                    select: {
                        user_id: true,
                        first_name: true,
                        last_name: true,
                        tg_username: true,
                        phone_number: true,
                        user_role: true
                    }
                },
                section: {
                    select: {
                        section_id: true,
                        section_name: true
                    }
                }
            }
        });

        // Transform to match the Teacher model format
        const teachers = teacherSections.map(ts => ({
            user_id: ts.teacher.user_id,
            user_role: ts.teacher.user_role,
            first_name: ts.teacher.first_name,
            last_name: ts.teacher.last_name,
            tg_username: ts.teacher.tg_username,
            phone_number: ts.teacher.phone_number,
            sections: ts.section.section_name
        }));

        // Get unique sections for reference
        const sections = await prisma.section.findMany({
            where: {
                section_id: { in: sectionIds }
            },
            select: {
                section_id: true,
                section_name: true
            }
        });

        return NextResponse.json({ teachers, sections }, { status: 200 });
    } catch (error) {
        console.error('Error fetching manager teachers:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
