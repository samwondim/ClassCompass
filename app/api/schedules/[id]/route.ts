
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { managerCanAccessSection } from '@/utils/access';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getRequestUser(request);
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const schedule = await prisma.schedule.findUnique({
            where: { schedule_id: id },
            include: {
                course: {
                    select: {
                        course_id: true,
                        course_name: true,
                        verse: true,
                        course_description: true,
                        age_group: true,
                        duration_minutes: true,
                        lesson_plan: true,
                        objectives: { select: { id: true, objective: true } },
                        unit: { select: { unit_id: true, title: true } },
                        resources: { select: { resource_id: true, title: true, type: true, url: true, mime_type: true } },
                    }
                },
                teacher: { select: { user_id: true, first_name: true, last_name: true } },
                section: { select: { section_id: true, section_name: true } },
            }
        });

        if (!schedule) {
            return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
        }

        // Teachers can view their own schedules
        if (currentUser.user_role === 'TEACHER') {
            if (schedule.teacher_id !== currentUser.user_id) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }
            return NextResponse.json({ schedule });
        }

        if (!["MANAGER", "ADMIN"].includes(currentUser.user_role || "")) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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
        const { course_id, teacher_id, schedule_date, section_id } = body;

        if (!course_id || !teacher_id || !schedule_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const scheduleDate = new Date(schedule_date);
        if (isNaN(scheduleDate.getTime())) {
            return NextResponse.json({ error: "Invalid schedule date" }, { status: 400 });
        }

        const teacherSections = await prisma.teacherSection.findMany({ where: { teacher_id } });
        if (teacherSections.length === 0) {
            return NextResponse.json({ error: "Selected teacher is not assigned to any section" }, { status: 400 });
        }

        // Respect an explicitly provided section_id, otherwise derive deterministically.
        let resolvedSectionId: string | null = null;
        if (section_id) {
            if (!teacherSections.some(ts => ts.section_id === section_id)) {
                return NextResponse.json({ error: "Teacher is not assigned to the provided section" }, { status: 400 });
            }
            resolvedSectionId = section_id;
        } else if (teacherSections.length === 1) {
            resolvedSectionId = teacherSections[0].section_id;
        } else {
            return NextResponse.json({ error: "Teacher is assigned to multiple sections; provide section_id" }, { status: 400 });
        }

        if (!resolvedSectionId) {
            return NextResponse.json({ error: "Unable to determine section" }, { status: 400 });
        }

        if (currentUser.user_role === 'MANAGER') {
            const hasAccess = await managerCanAccessSection(currentUser.user_id, resolvedSectionId);
            if (!hasAccess) {
                return NextResponse.json({ error: "Cannot assign schedule to a teacher outside your sections" }, { status: 403 });
            }
        }

        const changerName = currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : "Admin";

        const updatedSchedule = await prisma.schedule.update({
            where: { schedule_id: id },
            data: {
                course_id,
                teacher_id,
                section_id: resolvedSectionId,
                schedule_date: scheduleDate,
            },
            include: {
                course: { select: { course_id: true, course_name: true, course_description: true } },
                teacher: { select: { user_id: true, first_name: true, last_name: true, tg_id: true } },
                section: { select: { section_name: true, section_id: true } },
            }
        });

        if (updatedSchedule.teacher.tg_id) {
            const { notifyScheduleChange } = await import('@/utils/notifications');
            const detail = `Date: ${new Date(schedule_date).toLocaleDateString()}\nSection: ${updatedSchedule.section.section_name}`;
            await notifyScheduleChange(
                updatedSchedule.teacher.user_id,
                updatedSchedule.teacher.tg_id,
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

        const changerName = currentUser.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : "Admin";

        if (schedule.teacher.tg_id) {
            const { notifyScheduleChange } = await import('@/utils/notifications');
            const detail = `Date: ${new Date(schedule.schedule_date).toLocaleDateString()}\nSection: ${schedule.section.section_name}`;
            await notifyScheduleChange(
                schedule.teacher.user_id,
                schedule.teacher.tg_id,
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
