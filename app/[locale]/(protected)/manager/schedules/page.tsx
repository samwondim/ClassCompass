import { Schedule, Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { PaginatedTable } from "@/components/ui/paginated-table";
import { ScheduleCard } from "@/components/cards/schedule-card";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getUserRole } from "@/utils/data-access";
import { getManagerSectionIds } from "@/utils/access";

async function getTeachers(managerId: string): Promise<Teacher[]> {
  const sectionIds = await getManagerSectionIds(managerId);

  const teacherSections = await prisma.teacherSection.findMany({
    where: { section_id: { in: sectionIds } },
    include: { teacher: { select: { user_id: true, first_name: true, last_name: true } } }
  });

  const seen = new Map<string, Teacher>();
  for (const ts of teacherSections) {
    if (!seen.has(ts.teacher.user_id)) {
      seen.set(ts.teacher.user_id, {
        user_id: ts.teacher.user_id,
        first_name: ts.teacher.first_name,
        last_name: ts.teacher.last_name,
      } as Teacher);
    }
  }
  return Array.from(seen.values());
}

async function getData(): Promise<Schedule[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};

    const res = await fetch(`${baseUrl}/api/managers/schedules`, {
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

export default async function SchedulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getUserRole();
  if (!user) return null;

  const [teachers, data] = await Promise.all([getTeachers(user.user_id), getData()]);
  const base = `/${locale}/manager`;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-primary mb-6">መርሃ ግብሮች</h1>
      <PaginatedTable
        items={data}
        columns={columns}
        idKey="schedule_id"
        searchKeys={["course.course_name", "course.course_description", "teacher.first_name", "teacher.last_name", "section.section_name"]}
        cardComponent={ScheduleCard}
        searchPlaceholder="ፈልግ በትምህርት፣ መምህር..."
        emptyMessage="ምንም መርሃ ግብር አልተገኘም።"
        filterOptions={teachers.map(t => ({ label: `${t.first_name} ${t.last_name || ''}`.trim(), value: t.user_id }))}
        filterPlaceholder="መምህር ምረጥ"
        filterKey="teacher.user_id"
        addHref={`${base}/schedules/new`}
        addLabel="መርሃግብር ጨምር"
      />
    </div>
  );
}
