import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding development data...');

  // Clean existing data (in dependency-safe order)
  await prisma.notification.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.course.deleteMany();
  await prisma.teacherSection.deleteMany();
  await prisma.managerSection.deleteMany();
  await prisma.section.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const admin = await prisma.user.create({
    data: {
      tg_username: 'admin',
      tg_id: '1000001',
      user_role: 'ADMIN',
      first_name: 'Admin',
      last_name: 'User',
      phone_number: '+251900000001',
    },
  });

  const manager = await prisma.user.create({
    data: {
      tg_username: 'manager',
      tg_id: '1000002',
      user_role: 'MANAGER',
      first_name: 'Manager',
      last_name: 'User',
      phone_number: '+251900000002',
    },
  });

  const teacher = await prisma.user.create({
    data: {
      tg_username: 'teacher',
      tg_id: '1000003',
      user_role: 'TEACHER',
      first_name: 'Teacher',
      last_name: 'User',
      phone_number: '+251900000003',
    },
  });

  // Section
  const section = await prisma.section.create({
    data: {
      section_name: 'Sunday School',
      manager_id: manager.user_id,
    },
  });

  // Manager + Teacher assignments
  await prisma.managerSection.create({
    data: { manager_id: manager.user_id, section_id: section.section_id },
  });
  await prisma.teacherSection.create({
    data: { teacher_id: teacher.user_id, section_id: section.section_id },
  });

  // Course with objectives
  const course = await prisma.course.create({
    data: {
      course_name: 'John 3:16 - God So Loved the World',
      verse: 'John 3:16',
      course_description: 'Understanding the love of God shown through Jesus Christ.',
      section_id: section.section_id,
      created_by: admin.user_id,
      objectives: {
        create: [
          { objective: 'Understand the depth of God\'s love' },
          { objective: 'Memorize John 3:16' },
        ],
      },
    },
  });

  // Schedule for next Sunday at 10:00 AM
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + ((7 - now.getDay()) % 7 || 7));
  nextSunday.setHours(10, 0, 0, 0);

  await prisma.schedule.create({
    data: {
      course_id: course.course_id,
      section_id: section.section_id,
      teacher_id: teacher.user_id,
      schedule_date: nextSunday,
    },
  });

  console.log('Seed complete:');
  console.log('  admin  (tg_username: admin)');
  console.log('  manager (tg_username: manager)');
  console.log('  teacher (tg_username: teacher)');
  console.log(`  section "${section.section_name}"`);
  console.log(`  course "${course.course_name}"`);
  console.log(`  schedule for ${nextSunday.toLocaleDateString()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
