
// app/manager/page.tsx (or your file)
import { Manager, Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddTeacherButton } from "@/components/add-teacher-button";

// import prisma from "@/models/client"; // removed

async function getData(): Promise<Teacher[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/user/get-teachers`, {
      cache: 'no-store',
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

export default async function TeacherMgmtPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <AddTeacherButton />
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">No teachers found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
