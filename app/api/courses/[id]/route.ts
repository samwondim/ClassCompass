
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { course_name, verse, course_description, objectives } = body;

        // Transaction to update course and replace objectives
        const updatedCourse = await prisma.$transaction(async (tx) => {
            // 1. Update basic course info
            await tx.course.update({
                where: { course_id: id },
                data: {
                    course_name,
                    verse,
                    course_description
                },
            });

            // 2. Handle objectives if provided
            if (objectives && Array.isArray(objectives)) {
                // Delete existing objectives (simplest full-replace strategy)
                await tx.objective.deleteMany({
                    where: { course_id: id }
                });

                // Create new ones
                if (objectives.length > 0) {
                    await tx.objective.createMany({
                        data: objectives.map((obj: any) => ({
                            objective: typeof obj === 'string' ? obj : obj.objective,
                            course_id: id
                        }))
                    });
                }
            }

            // 3. Return updated course with objectives
            return await tx.course.findUnique({
                where: { course_id: id },
                include: { objectives: true }
            });
        });

        return NextResponse.json({ course: updatedCourse });

    } catch (error) {
        console.error("Update course error:", error);
        return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;

        await prisma.course.delete({
            where: { course_id: id },
        });

        return NextResponse.json({ message: "Course deleted successfully" });

    } catch (error) {
        console.error("Delete course error:", error);
        return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
    }
}
