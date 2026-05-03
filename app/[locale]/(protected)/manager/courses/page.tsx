import { Course } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { cookies } from "next/headers";
import { Filter } from "@/components/filter";
import prisma from "@/models/client";
import { getUserRole } from "@/utils/data-access";

async function getData(sectionId?: string): Promise<Course[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};

    const url = new URL(`${baseUrl}/api/courses`);
    if (sectionId && sectionId !== 'all') {
      url.searchParams.set('sectionId', sectionId);
    }

    const res = await fetch(url.toString(), {
      cache: 'no-store',
      headers,
    });

    if (!res.ok) {
      console.error('Failed to fetch courses', res.status, await res.text());
      return [];
    }

    const { courses } = await res.json();
    return courses || [];
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

async function getSections(managerId: string) {
  const managerSections = await prisma.managerSection.findMany({
    where: { manager_id: managerId },
    include: { section: true }
  });
  return managerSections.map(ms => ms.section);
}

// -------- PAGE --------
export default async function CoursesPage({ params, searchParams }: { params: { locale: string }, searchParams: { sectionId?: string } }) {
  const user = await getUserRole();
  if (!user) return null;
  
  const data = await getData(searchParams.sectionId);
  const sections = await getSections(user.user_id);
  const base = `/${params.locale}/manager`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-2xl font-bold">ትምህርቶች</h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Filter
            options={sections.map(s => ({ label: s.section_name, value: s.section_id }))}
            placeholder="ክፍል ምረጥ"
            paramName="sectionId"
          />
          <Link href={`${base}/courses/new`} className="w-full sm:w-auto">
            <span className="inline-flex w-full sm:w-auto justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              ትምህርት ጨምር
            </span>
          </Link>
        </div>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground">ምንም ትምህርት አልተገኘም።</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
