import { Schedule, Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { cookies } from "next/headers";
import { Filter } from "@/components/filter";
import prisma from "@/models/client";
import { getUserRole } from "@/utils/data-access";

async function getTeachers(managerId: string): Promise<Teacher[]> {
  const managerSections = await prisma.managerSection.findMany({
    where: { manager_id: managerId },
    select: { section_id: true }
  });
  const sectionIds = managerSections.map(ms => ms.section_id);
  
  const teacherSections = await prisma.teacherSection.findMany({
    where: { section_id: { in: sectionIds } },
    include: { teacher: true }
  });

  return teacherSections.map(ts => ({
    user_id: ts.teacher.user_id,
    first_name: ts.teacher.first_name,
    last_name: ts.teacher.last_name
  } as Teacher));
}

async function getData(teacherId?: string): Promise<Schedule[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};

    const url = new URL(`${baseUrl}/api/managers/schedules`);
    if (teacherId) url.searchParams.set('teacherId', teacherId);

    const res = await fetch(url.toString(), {
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

export default async function SchedulesPage({ params, searchParams }: { params: { locale: string }, searchParams: { teacherId?: string } }) {
  const user = await getUserRole();
  if (!user) return null;
  const teachers = await getTeachers(user.user_id);
  const data = await getData(searchParams.teacherId);
  const base = `/${params.locale}/manager`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-2xl font-bold">መርሃ ግብሮች</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Filter
            options={teachers.map(t => ({ label: `${t.first_name} ${t.last_name || ''}`.trim(), value: t.user_id }))}
            placeholder="መምህር ምረጥ"
            paramName="teacherId"
          />
          <Link href={`${base}/schedules/new`} className="w-full sm:w-auto">
            <span className="inline-flex w-full sm:w-auto justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              መርሃግብር ጨምር
            </span>
          </Link>
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
}
