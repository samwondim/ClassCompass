import { NextResponse } from 'next/server';
import prisma from '@/models/client';
import { Bot } from 'grammy';
import { nextSunday, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const bot = new Bot(process.env.BOT_TOKEN!);

        // Calculate next Sunday
        const sunday = nextSunday(new Date());
        const startOfSunday = startOfDay(sunday);
        const endOfSunday = endOfDay(sunday);

        // Find schedules for next Sunday
        const schedules = await prisma.schedule.findMany({
            where: {
                schedule_date: {
                    gte: startOfSunday,
                    lte: endOfSunday,
                },
            },
            include: {
                teacher: true,
                course: true,
                section: true,
            },
        });

        if (schedules.length === 0) {
            return NextResponse.json({ message: 'No schedules found for next Sunday' });
        }

        // Group schedules by teacher
        const schedulesByTeacher: Record<string, typeof schedules> = {};
        for (const schedule of schedules) {
            const teacherId = schedule.teacher_id;
            if (!schedulesByTeacher[teacherId]) {
                schedulesByTeacher[teacherId] = [];
            }
            schedulesByTeacher[teacherId].push(schedule);
        }

        // Send notifications
        const results = [];
        for (const teacherId in schedulesByTeacher) {
            const teacherSchedules = schedulesByTeacher[teacherId];
            const teacher = teacherSchedules[0].teacher;

            if (!teacher.tg_id) {
                results.push({ teacher: teacher.first_name, status: 'skipped', reason: 'No Telegram ID' });
                continue;
            }

            let message = `📅 *Upcoming Schedule for Sunday, ${sunday.toLocaleDateString()}*\n\n`;

            for (const schedule of teacherSchedules) {
                message += `• *Course:* ${schedule.course.course_name}\n`;
                message += `  *Verse:* ${schedule.course.verse || 'N/A'}\n`;
                message += `  *Section:* ${schedule.section.section_name}\n\n`;
            }

            try {
                await bot.api.sendMessage(teacher.tg_id, message, { parse_mode: 'Markdown' });
                results.push({ teacher: teacher.first_name, status: 'sent' });
            } catch (error) {
                console.error(`Failed to send message to ${teacher.first_name}:`, error);
                results.push({ teacher: teacher.first_name, status: 'failed', error: String(error) });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
    }
}
