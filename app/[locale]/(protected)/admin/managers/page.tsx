// app/manager/page.tsx (or your file)
import { Manager } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddManagerButton } from "@/components/add-manager-button";

async function getData(): Promise<Manager[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/get-managers`, {
      cache: 'no-store', // Fresh data each load
    });
    if (!res.ok) {
      console.error('Failed to fetch managers:', res.statusText);
      return [];
    }
    const response = await res.json(); // Full object: { managers: [...] }
    const managers: Manager[] = response.managers || []; // Extract array; fallback to []
    return managers;
  } catch (error) {
    console.error('Error fetching managers:', error);
    return [];
  }
}

export default async function DemoPage() {
  const data = await getData();
  console.log("MANAGER DATA (ARRAY):", data); // Now logs the array directly

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Managers</h1>
        <AddManagerButton />
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">No managers found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
