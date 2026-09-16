
import { Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { UsersTable } from "@/components/users/users-table";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

async function getSections(): Promise<{ section_id: string; section_name: string }[]> {
  return await prisma.section.findMany({
    select: { section_id: true, section_name: true },
    orderBy: { section_name: 'asc' }
  });
}

async function getData(): Promise<Teacher[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};
    const res = await fetch(`${baseUrl}/api/user/get-teachers`, {
      cache: 'no-store',
      headers,
    });

    if (!res.ok) {
      console.error('Failed to fetch teachers', res.status, await res.text());
      return [];
    }

    const { teachers } = await res.json();
    return teachers || [];
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

export default async function TeacherMgmtPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [data, sections] = await Promise.all([getData(), getSections()]);
  const base = `/${locale}/admin`;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">መምህራን</h1>
      <UsersTable
        users={data}
        columns={columns}
        addHref={`${base}/teachers/new`}
        addLabel="መምህር መዝግብ"
        editBase="/admin/teachers"
        sectionOptions={sections.map(s => ({ label: s.section_name || 'ክፍል', value: s.section_id }))}
      />
    </div>
  );
}
