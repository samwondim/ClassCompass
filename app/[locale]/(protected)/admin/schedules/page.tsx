// app/(protected)/admin/schedules/page.tsx
import { Schedule } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { cookies } from "next/headers";

// import prisma from "@/models/client"; // removed

async function getData(): Promise<Schedule[]> {
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

export default async function SchedulesPage({ params }: { params: { locale: string } }) {
  const data = await getData();
  const base = `/${params.locale}/admin`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">መርሃ ግብሮች</h1>
        <Link href={`${base}/schedules/new`}>
          <span className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">መርሃግብር መዝግብ</span>
        </Link>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
}
