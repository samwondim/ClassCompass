// app/(protected)/admin/schedules/page.tsx
import { Schedule } from "@/app/models/models";
import { columns } from "./columns";
import { PaginatedTable } from "@/components/ui/paginated-table";
import { ScheduleCard } from "@/components/cards/schedule-card";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

async function getSchedules(): Promise<Schedule[]> {
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

async function getSections(): Promise<{ section_id: string; section_name: string }[]> {
  return await prisma.section.findMany({
    select: { section_id: true, section_name: true },
    orderBy: { section_name: 'asc' }
  });
}

export default async function SchedulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [schedules, sections] = await Promise.all([getSchedules(), getSections()]);
  const base = `/${locale}/admin`;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-primary mb-6">መርሃ ግብሮች</h1>
      <PaginatedTable
        items={schedules}
        columns={columns}
        idKey="schedule_id"
        searchKeys={["course.course_name", "course.course_description", "teacher.first_name", "teacher.last_name", "section.section_name"]}
        cardComponent={ScheduleCard}
        searchPlaceholder="ፈልግ በትምህርት፣ መምህር..."
        emptyMessage="ምንም መርሃ ግብር አልተገኘም።"
        filterOptions={sections.map(s => ({ label: s.section_name, value: s.section_id }))}
        filterPlaceholder="ክፍል ምረጥ"
        filterKey="section.section_id"
        addHref={`${base}/schedules/new`}
        addLabel="መርሃግብር መዝግብ"
      />
    </div>
  );
}
