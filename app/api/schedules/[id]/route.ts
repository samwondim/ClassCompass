
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { course_id, teacher_id, schedule_date } = body;

        if (!course_id || !teacher_id || !schedule_date) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Lookup Teacher's Section
        const teacherSection = await prisma.teacherSection.findFirst({
            where: { teacher_id: teacher_id }
        });

        if (!teacherSection) {
            return NextResponse.json({ error: "Selected teacher is not assigned to any section" }, { status: 400 });
        }

        // Check for potential conflicts? (Optional, maybe later)

        const updatedSchedule = await prisma.schedule.update({
            where: { schedule_id: id },
            data: {
                course_id,
                teacher_id,
                section_id: teacherSection.section_id,
                schedule_date: new Date(schedule_date),
            },
            include: {
                course: { select: { course_id: true, course_description: true } },
                teacher: { select: { user_id: true, first_name: true, last_name: true } },
                section: { select: { section_name: true, section_id: true } },
            }
        });

        return NextResponse.json({ schedule: updatedSchedule });

    } catch (error) {
        console.error("Update schedule error:", error);
        return NextResponse.json({ error: "Failed to update schedule" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        await prisma.schedule.delete({
            where: { schedule_id: id },
        });

        return NextResponse.json({ message: "Schedule deleted successfully" });

    } catch (error) {
        console.error("Delete schedule error:", error);
        return NextResponse.json({ error: "Failed to delete schedule" }, { status: 500 });
    }
}
