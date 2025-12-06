// app/(protected)/admin/schedules/page.tsx
import { Schedule } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddScheduleButton } from "./AddScheduleButton"; // move it to separate file

async function getData(): Promise<Schedule[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/schedules`, {
      cache: 'no-store',
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
