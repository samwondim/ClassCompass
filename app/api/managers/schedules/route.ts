import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';
import { getUserRole } from '@/utils/data-access';

/**
 * GET /api/managers/schedules
 * Returns only schedules for sections managed by the authenticated manager
 */
export async function GET(request: NextRequest) {
    try {
        // Get authenticated user
        const user = await getUserRole();

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        if (user.user_role !== 'MANAGER') {
            return NextResponse.json({ error: 'Unauthorized: Only managers can access this endpoint' }, { status: 403 });
        }

        // Get sections managed by this manager (both direct manager_id and ManagerSection join)
        const [managerSections, directSections] = await Promise.all([
            prisma.managerSection.findMany({
                where: { manager_id: user.user_id },
                select: { section_id: true },
            }),
            prisma.section.findMany({
                where: { manager_id: user.user_id },
                select: { section_id: true },
            }),
        ]);

        const sectionIds = Array.from(
            new Set([
                ...managerSections.map(ms => ms.section_id),
                ...directSections.map(section => section.section_id),
            ])
        );

        if (sectionIds.length === 0) {
            return NextResponse.json({ schedules: [] }, { status: 200 });
        }

        // Fetch schedules for those sections
        const schedules = await prisma.schedule.findMany({
            where: {
                section_id: { in: sectionIds }
            },
            include: {
                course: {
                    select: {
                        course_id: true,
                        course_name: true,
                        verse: true,
                        course_description: true
                    }
                },
                section: {
                    select: {
                        section_id: true,
                        section_name: true
                    }
                },
                teacher: {
                    select: {
                        user_id: true,
                        first_name: true,
                        last_name: true,
                        phone_number: true
                    }
                }
            },
            orderBy: {
                schedule_date: 'asc'
            }
        });

        return NextResponse.json({ schedules }, { status: 200 });
    } catch (error) {
        console.error('Error fetching manager schedules:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
