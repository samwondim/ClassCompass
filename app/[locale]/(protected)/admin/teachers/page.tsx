
// app/manager/page.tsx (or your file)
import { Manager, Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { cookies, headers } from "next/headers";

// import prisma from "@/models/client"; // removed

async function getData(): Promise<Teacher[]> {
  try {
    const headerList = headers();
    const host = headerList.get("x-forwarded-host") || headerList.get("host");
    const protocol = headerList.get("x-forwarded-proto") || "http";
    const baseUrl =
      (host ? `${protocol}://${host}` : "") ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';

    const session = cookies().get("session")?.value;
    const authHeaders = session ? { cookie: `session=${session}` } : {};
    const res = await fetch(`${baseUrl}/api/user/get-teachers`, {
      cache: 'no-store',
      headers: authHeaders,
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

export default async function TeacherMgmtPage({ params }: { params: { locale: string } }) {
  const data = await getData();
  const base = `/${params.locale}/admin`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">መምህራን</h1>
        <Link href={`${base}/teachers/new`}>
          <span className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">መምህር መዝግብ</span>
        </Link>
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">ምንም መምህር አልተገኘም</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
