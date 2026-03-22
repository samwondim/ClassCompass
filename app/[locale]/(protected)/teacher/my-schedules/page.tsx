// app/(protected)/teacher/schedules/page.tsx (sample page using the table)
import { columns } from './columns';
import { DataTable } from './data-table';
import { Schedule } from '@/app/models/models'; // Adjust import
import { cookies } from "next/headers";

async function getTeacherSchedules(): Promise<Schedule[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};

    const res = await fetch(`${baseUrl}/api/schedules`, {
      cache: 'no-store',
      headers,
    });

    if (!res.ok) {
      console.error('Failed to fetch schedules', res.status, await res.text());
      return [];
    }

    const { schedules } = await res.json();
    return schedules || [];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

export default async function TeacherSchedulesPage() {

  const schedules = await getTeacherSchedules();

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">My Schedules</h1>
      <DataTable columns={columns} data={schedules} />
    </div>
  );
}
