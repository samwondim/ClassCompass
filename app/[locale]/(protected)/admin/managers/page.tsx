// app/admin/managers/page.tsx
import { Manager } from "@/app/models/models";
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

async function getData(): Promise<Manager[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};
    const res = await fetch(`${baseUrl}/api/user/get-managers`, {
      cache: 'no-store',
      headers,
    });

    if (!res.ok) {
      console.error('Failed to fetch managers', res.status, await res.text());
      return [];
    }

    const { managers } = await res.json();
    return managers || [];
  } catch (error) {
    console.error('Error fetching managers:', error);
    return [];
  }
}

export default async function ManagersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const [data, sections] = await Promise.all([getData(), getSections()]);
  const base = `/${locale}/admin`;

  const managers = data.map((m: any) => ({
    ...m,
    section_ids: (m.sections || []).map((s: any) => s.section_id),
  }));

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">ማናጀሮች</h1>
      <UsersTable
        users={managers}
        columns={columns}
        addHref={`${base}/managers/new`}
        addLabel="አዲስ ማናጀር"
        editBase="/admin/managers"
        sectionOptions={sections.map(s => ({ label: s.section_name || 'ክፍል', value: s.section_id }))}
      />
    </div>
  );
}
