// app/(protected)/teacher/schedules/page.tsx (sample page using the table)
import { columns } from './columns';
import { DataTable } from './data-table';
import { Schedule } from '@/app/models/models'; // Adjust import

import { getSession } from '@/utils/session';
import prisma from '@/models/client';

async function getTeacherSchedules(): Promise<Schedule[]> {
  try {
    const session = await getSession();
    const user = session?.fetched_user;

    if (!user || !user.user_id) {
      return [];
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        teacher_id: user.user_id
      },
      include: {
        course: {
          include: { objectives: true }
        },
        teacher: {
          select: {
            user_id: true,
            first_name: true,
            last_name: true,
            teacher_sections: {
              include: { section: true }
            }
          }
        },
        section: true
      },
    });
    return schedules as any;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

export default async function TeacherSchedulesPage() {

  const schedules = await getTeacherSchedules();

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">My Schedules</h1>
      <DataTable columns={columns} data={schedules} />
    </div>
  );
}
