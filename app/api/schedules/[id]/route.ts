
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';

import { getRequestUser } from '@/utils/request-auth';

async function managerCanAccessSection(managerId: string, sectionId: string): Promise<boolean> {
    const [managerSections, directSections] = await Promise.all([
        prisma.managerSection.findMany({
            where: { manager_id: managerId },
            select: { section_id: true },
        }),
        prisma.section.findMany({
            where: { manager_id: managerId },
            select: { section_id: true },
        }),
    ]);

    const allowedSectionIds = new Set([
        ...managerSections.map(ms => ms.section_id),
        ...directSections.map(s => s.section_id),
    ]);

    return allowedSectionIds.has(sectionId);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getRequestUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!["MANAGER", "ADMIN"].includes(currentUser.user_role || "")) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const schedule = await prisma.schedule.findUnique({
            where: { schedule_id: id },
            include: {
                course: { select: { course_id: true, course_name: true, verse: true, course_description: true } },
                teacher: { select: { user_id: true, first_name: true, last_name: true } },
                section: { select: { section_id: true, section_name: true } },
            }
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        if (currentUser.user_role === 'MANAGER') {
            const hasAccess = await managerCanAccessSection(currentUser.user_id, schedule.section.section_id);
            if (!hasAccess) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        return NextResponse.json({ schedule });
    } catch (error) {
        console.error("Get schedule error:", error);
        return NextResponse.json({ error: "Failed to fetch schedule" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getRequestUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!["MANAGER", "ADMIN"].includes(currentUser.user_role || "")) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        const existingSchedule = await prisma.schedule.findUnique({
            where: { schedule_id: id },
            select: { section_id: true },
        });

        if (!existingSchedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        if (currentUser.user_role === 'MANAGER') {
            const hasAccess = await managerCanAccessSection(currentUser.user_id, existingSchedule.section_id);
            if (!hasAccess) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        const body = await request.json();
        const { course_id, teacher_id, schedule_date } = body;

        if (!course_id || !teacher_id || !schedule_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const teacherSection = await prisma.teacherSection.findFirst({
            where: { teacher_id: teacher_id }
        });

        if (!teacherSection) {
            return NextResponse.json({ error: "Selected teacher is not assigned to any section" }, { status: 400 });
        }

        if (currentUser.user_role === 'MANAGER') {
            const hasAccess = await managerCanAccessSection(currentUser.user_id, teacherSection.section_id);
            if (!hasAccess) {
                return NextResponse.json({ error: "Cannot assign schedule to a teacher outside your sections" }, { status: 403 });
            }
        }

        const changerName = `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() || "Admin";

        const updatedSchedule = await prisma.schedule.update({
            where: { schedule_id: id },
            data: {
                course_id,
                teacher_id,
                section_id: teacherSection.section_id,
                schedule_date: new Date(schedule_date),
            },
            include: {
                course: { select: { course_id: true, course_name: true, course_description: true } },
                teacher: { select: { user_id: true, first_name: true, last_name: true, tg_id: true } },
                section: { select: { section_name: true, section_id: true } },
            }
        });

        if (updatedSchedule.teacher.tg_id) {
            const { notifyScheduleChange } = await import('@/utils/notifications');
            const detail = `Date: ${new Date(schedule_date).toLocaleString()}\nSection: ${updatedSchedule.section.section_name}`;
            await notifyScheduleChange(
                updatedSchedule.teacher.user_id,
                updatedSchedule.teacher.tg_id.toString(),
                'Changed',
                updatedSchedule.course.course_name || updatedSchedule.course.course_description || 'Unknown Course',
                changerName,
                detail
            );
        }

        return NextResponse.json({ schedule: updatedSchedule });

    } catch (error) {
        console.error("Update schedule error:", error);
        return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getRequestUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        if (!["MANAGER", "ADMIN"].includes(currentUser.user_role || "")) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;

        const schedule = await prisma.schedule.findUnique({
            where: { schedule_id: id },
            include: {
                course: true,
                teacher: true,
                section: true
            }
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        if (currentUser.user_role === 'MANAGER') {
            const hasAccess = await managerCanAccessSection(currentUser.user_id, schedule.section.section_id);
            if (!hasAccess) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
        }

        await prisma.schedule.delete({
            where: { schedule_id: id },
        });

        const changerName = `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() || "Admin";

        if (schedule.teacher.tg_id) {
            const { notifyScheduleChange } = await import('@/utils/notifications');
            const detail = `Date: ${new Date(schedule.schedule_date).toLocaleString()}\nSection: ${schedule.section.section_name}`;
            await notifyScheduleChange(
                schedule.teacher.user_id,
                schedule.teacher.tg_id.toString(),
                'Removed',
                schedule.course.course_name || schedule.course.course_description || 'Unknown Course',
                changerName,
                detail
            );
        }

        return NextResponse.json({ message: "Schedule deleted successfully" });

    } catch (error) {
        console.error("Delete schedule error:", error);
        return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
    }
}
