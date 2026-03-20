// app/(protected)/teacher/schedules/page.tsx (sample page using the table)
import { columns } from './columns';
import { DataTable } from './data-table';
import { Schedule } from '@/app/models/models'; // Adjust import
import { cookies, headers } from "next/headers";

async function getTeacherSchedules(): Promise<Schedule[]> {
  try {
    const headerList = headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const protocol = headerList.get("x-forwarded-proto") || "http";
    const baseUrl =
      (host ? `${protocol}://${host}` : "") ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = cookies().get("session")?.value;
    const authHeaders = session ? { cookie: `session=${session}` } : {};

    const res = await fetch(`${baseUrl}/api/schedules`, {
      cache: 'no-store',
      headers: authHeaders,
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
