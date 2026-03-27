// app/manager/page.tsx
import { Manager } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { cookies } from "next/headers";

// import prisma from "@/models/client"; // removed

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

export default async function DemoPage({ params }: { params: { locale: string } }) {
  const data = await getData();
  const base = `/${params.locale}/admin`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">አስተዳዳሪዎች</h1>
        <Link href={`${base}/managers/new`}>
          <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">አዲስ አስተዳዳሪ</span>
        </Link>
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">አስተዳዳሪዎች አልተገኙም</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
