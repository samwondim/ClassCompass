
import { Course } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import AddCourseButton from "@/components/add-course-button";


// import prisma from "@/models/client"; // removed

async function getData(): Promise<Course[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/courses`, {
      cache: 'no-store',
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


// -------- PAGE --------
export default async function CoursesPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <AddCourseButton />
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground">No courses found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}


