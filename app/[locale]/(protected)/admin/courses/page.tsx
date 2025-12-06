
import { Course } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import AddCourseButton from "@/components/add-course-button";


import prisma from '@/models/client';

// -------- FETCH COURSES --------
async function getData(): Promise<Course[]> {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { created_at: "desc" },
      include: {
        objectives: true, // <-- include all objectives for each course
        created_by_user: {
          select: {
            first_name: true,
            last_name: true,
            tg_username: true,
          },
        },
      }
    });

    return courses as any; // Type assertion needed due to prisma vs frontend model mismatch if any
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


