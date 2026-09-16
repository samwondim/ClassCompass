import { Course } from "@/app/models/models";
import { columns } from "./columns";
import { PaginatedTable } from "@/components/ui/paginated-table";
import { CourseCard } from "@/components/cards/course-card";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getUserRole } from "@/utils/data-access";
import { getManagerSectionIds } from "@/utils/access";

async function getData(): Promise<Course[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};

    const res = await fetch(`${baseUrl}/api/courses`, {
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

async function getSections(managerId: string): Promise<{ section_id: string; section_name: string }[]> {
  const sectionIds = await getManagerSectionIds(managerId);
  if (sectionIds.length === 0) return [];
  return await prisma.section.findMany({
    where: { section_id: { in: sectionIds } },
    select: { section_id: true, section_name: true },
    orderBy: { section_name: 'asc' }
  });
}

export default async function CoursesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await getUserRole();
  if (!user) return null;

  const [data, sections] = await Promise.all([getData(), getSections(user.user_id)]);
  const base = `/${locale}/manager`;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-primary mb-6">ትምህርቶች</h1>
      <PaginatedTable
        items={data}
        columns={columns}
        idKey="course_id"
        searchKeys={["course_name", "verse", "course_description"]}
        cardComponent={CourseCard}
        searchPlaceholder="ፈልግ በትምህርት..."
        emptyMessage="ምንም ትምህርት አልተገኘም።"
        filterOptions={sections.map(s => ({ label: s.section_name, value: s.section_id }))}
        filterPlaceholder="ክፍል ምረጥ"
        filterKey="section.section_id"
        addHref={`${base}/courses/new`}
        addLabel="ትምህርት ጨምር"
      />
    </div>
  );
}
