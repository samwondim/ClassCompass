import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';
import { getUserRole } from '@/utils/data-access';

/**
 * GET /api/managers/sections
 * Returns only the sections assigned to the authenticated manager
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

        // Fetch sections assigned to this manager using ManagerSection table
        const managerSections = await prisma.managerSection.findMany({
            where: {
                manager_id: user.user_id
            },
            include: {
                section: {
                    select: {
                        section_id: true,
                        section_name: true
                    }
                }
            }
        });

        const sections = managerSections.map(ms => ms.section);

        return NextResponse.json({ sections }, { status: 200 });
    } catch (error) {
        console.error('Error fetching manager sections:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
