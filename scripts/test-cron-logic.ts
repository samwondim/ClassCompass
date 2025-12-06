import { PrismaClient } from '../generated/prisma/index.js';
import { Bot } from 'grammy';
import { nextSunday, startOfDay, endOfDay } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function run() {
    console.log('Starting manual cron logic test...');

    if (!process.env.BOT_TOKEN) {
        console.error('BOT_TOKEN is missing');
        return;
    }

    const bot = new Bot(process.env.BOT_TOKEN);

    // Calculate next Sunday
    const sunday = nextSunday(new Date());
    const startOfSunday = startOfDay(sunday);
    const endOfSunday = endOfDay(sunday);

    console.log(`Checking schedules for: ${sunday.toLocaleDateString()}`);

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

    console.log(`Found ${schedules.length} schedules.`);

    if (schedules.length === 0) {
        console.log('No schedules found. Exiting.');
        return;
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
    for (const teacherId in schedulesByTeacher) {
        const teacherSchedules = schedulesByTeacher[teacherId];
        const teacher = teacherSchedules[0].teacher;

        console.log(`Processing teacher: ${teacher.first_name} (${teacher.tg_id})`);

        if (!teacher.tg_id) {
            console.log(`- Skipped: No Telegram ID`);
            continue;
        }

        let message = `📅 *Upcoming Schedule for Sunday, ${sunday.toLocaleDateString()}*\n\n`;

        for (const schedule of teacherSchedules) {
            message += `• *Course:* ${schedule.course.course_name}\n`;
            message += `  *Verse:* ${schedule.course.verse || 'N/A'}\n`;
            message += `  *Section:* ${schedule.section.section_name}\n\n`;
        }

        try {
            // Uncomment to actually send messages during test
            // await bot.api.sendMessage(teacher.tg_id, message, { parse_mode: 'Markdown' });
            console.log(`- Message generated:\n${message}`);
            console.log(`- [MOCK] Message sent to ${teacher.tg_id}`);
        } catch (error) {
            console.error(`- Failed to send message:`, error);
        }
    }

    console.log('Test completed.');
}

run()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
