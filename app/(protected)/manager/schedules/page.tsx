// app/(protected)/admin/schedules/page.tsx
import { Schedule } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddScheduleButton } from "./AddScheduleButton"; // move it to separate file

async function getData(): Promise<Schedule[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/schedules`);
  const { schedules } = await res.json();

  return schedules ?? [];
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
