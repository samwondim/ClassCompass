import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

async function run() {
    console.log('Cleaning up mock data...');

    // Delete mock teacher (cascade should delete related data if configured, but let's be safe)
    // Actually, schema says:
    // teacher    User    @relation(fields: [teacher_id], references: [user_id], onDelete: Cascade)
    // So deleting user should delete schedules.
    // But courses created by user?
    // created_by_user    User        @relation("CreatedCourses", fields: [created_by], references: [user_id], onDelete: Cascade)
    // So deleting the user should delete the course too.

    // What about section?
    // Section doesn't belong to a user directly in terms of ownership for deletion, but manager?
    // manager          User?            @relation("ManagerSections", fields: [manager_id], references: [user_id], onDelete: SetNull)

    // So I need to delete the section separately if I created it.

    const teacher = await prisma.user.findFirst({
        where: { tg_username: 'mock_teacher' },
    });

    if (teacher) {
        console.log(`Deleting teacher: ${teacher.first_name}`);
        await prisma.user.delete({
            where: { user_id: teacher.user_id },
        });
    } else {
        console.log('Mock teacher not found.');
    }

    const section = await prisma.section.findFirst({
        where: { section_name: 'Mock Section' },
    });

    if (section) {
        console.log(`Deleting section: ${section.section_name}`);
        await prisma.section.delete({
            where: { section_id: section.section_id },
        });
    } else {
        console.log('Mock section not found.');
    }

    console.log('Cleanup completed.');
}

run()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
