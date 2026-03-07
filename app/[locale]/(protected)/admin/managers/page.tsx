// app/manager/page.tsx
import { Manager } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddManagerButton } from "@/components/add-manager-button";

// import prisma from "@/models/client"; // removed

async function getData(): Promise<Manager[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/user/get-managers`, {
      cache: 'no-store',
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

export default async function DemoPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">አስተዳዳሪዎች</h1>
        <AddManagerButton />
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">አስተዳዳሪዎች አልተገኙም</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
