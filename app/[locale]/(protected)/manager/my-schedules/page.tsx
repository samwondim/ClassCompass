import { myScheduleColumns } from '@/components/schedules/my-schedules-columns';
import { MySchedulesTable } from '@/components/schedules/my-schedules-table';
import { Schedule } from '@/app/models/models';
import { cookies } from "next/headers";

async function getMySchedules(): Promise<Schedule[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};

    const res = await fetch(`${baseUrl}/api/schedules/my`, {
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

export default async function ManagerMySchedulesPage() {
  const schedules = await getMySchedules();

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">My Schedules</h1>
      <MySchedulesTable columns={myScheduleColumns} data={schedules} />
    </div>
  );
}
