import { PrismaClient } from '../generated/prisma/index.js';
import { nextSunday } from 'date-fns';

const prisma = new PrismaClient();

async function run() {
    console.log('Seeding mock schedule...');

    // 1. Find or create a teacher
    let teacher = await prisma.user.findFirst({
        where: { user_role: 'TEACHER' },
    });

    if (!teacher) {
        console.log('Creating mock teacher...');
        teacher = await prisma.user.create({
            data: {
                first_name: 'Mock',
                last_name: 'Teacher',
                tg_username: 'mock_teacher',
                user_role: 'TEACHER',
                // Use a dummy phone number
                phone_number: '1234567890',
            },
        });
    }
    console.log(`Using teacher: ${teacher.first_name} (${teacher.user_id})`);

    // 2. Find or create a course
    let course = await prisma.course.findFirst();
    if (!course) {
        console.log('Creating mock course...');
        course = await prisma.course.create({
            data: {
                course_name: 'Mock Course',
                verse: 'John 3:16',
                created_by: teacher.user_id,
            },
        });
    }
    console.log(`Using course: ${course.course_name} (${course.course_id})`);

    // 3. Find or create a section
    let section = await prisma.section.findFirst();
    if (!section) {
        console.log('Creating mock section...');
        section = await prisma.section.create({
            data: {
                section_name: 'Mock Section',
            },
        });
    }
    console.log(`Using section: ${section.section_name} (${section.section_id})`);

    // 4. Create a schedule for next Sunday
    const sunday = nextSunday(new Date());
    // Set time to 10:00 AM
    sunday.setHours(10, 0, 0, 0);

    const schedule = await prisma.schedule.create({
        data: {
            course_id: course.course_id,
            section_id: section.section_id,
            teacher_id: teacher.user_id,
            schedule_date: sunday,
        },
    });

    console.log(`Created schedule for ${sunday.toLocaleDateString()} with ID: ${schedule.schedule_id}`);
}

run()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
