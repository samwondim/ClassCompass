
// app/manager/page.tsx (or your file)
import { Manager, Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddTeacherButton } from "@/components/add-teacher-button";

async function getData(): Promise<Teacher[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/user/get-teachers`, {
      cache: 'no-store', // Fresh data each load
    });
    if (!res.ok) {
      console.error('Failed to fetch teachers:', res.statusText);
      return [];
    }
    const response = await res.json(); // Full object: { teachers: [...] }
    const teachers: Teacher[] = response.teachers || []; // Extract array; fallback to []
    return teachers;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

export default async function TeacherMgmtPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
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
