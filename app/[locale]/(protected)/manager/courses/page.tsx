
import { Course } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { cookies } from "next/headers";


// -------- FETCH COURSES --------
async function getData(): Promise<Course[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};
    const res = await fetch(`${baseUrl}/api/courses`, {
      cache: 'no-store',
      headers,
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
export default async function CoursesPage({ params }: { params: { locale: string } }) {
  const data = await getData();
  const base = `/${params.locale}/manager`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <Link href={`${base}/courses/new`}>
          <span className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">Add Course</span>
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground">No courses found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
