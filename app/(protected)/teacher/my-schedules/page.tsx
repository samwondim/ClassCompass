// app/(protected)/teacher/schedules/page.tsx (sample page using the table)
import { columns } from './columns';
import { DataTable } from './data-table';
import { Schedule } from '@/app/models/models'; // Adjust import

async function getTeacherSchedules(): Promise<Schedule[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/schedules?teacherId=${teacherId}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch schedules:', res.statusText);
      return [];
    }
    const response = await res.json();
    return response.schedules || [];
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
