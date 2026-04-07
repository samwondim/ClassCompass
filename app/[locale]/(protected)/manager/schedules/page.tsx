import { Suspense } from 'react';
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

    // Use manager-scoped endpoint that returns only schedules for manager's sections
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <div className="flex gap-4">
          <Suspense fallback={<div>Loading filters...</div>}>
            <Filter 
              options={teachers.map(t => ({ label: `${t.first_name} ${t.last_name || ''}`, value: t.user_id }))} 
              placeholder="Select Teacher" 
              paramName="teacherId"
            />
          </Suspense>
          <Link href={`${base}/schedules/new`}>
            <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Add Schedule</span>
          </Link>
        </div>
      </div>

      <DataTable columns={columns} data={data} />
    </div>
  );
}
