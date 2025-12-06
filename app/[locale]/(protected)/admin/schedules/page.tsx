// app/(protected)/admin/schedules/page.tsx
import { Schedule } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddScheduleButton } from "./AddScheduleButton"; // move it to separate file

import prisma from '@/models/client';

async function getData(): Promise<Schedule[]> {
  try {
    const schedules = await prisma.schedule.findMany({
      include: {
        course: { select: { course_id: true, course_description: true } },
        teacher: { select: { user_id: true, first_name: true, last_name: true } },
      },
    });
    return schedules as any;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

export default async function SchedulesPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <AddScheduleButton />
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
}
