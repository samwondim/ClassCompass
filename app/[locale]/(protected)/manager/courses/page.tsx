
import { Course } from "@/app/models/models";
import { getColumns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";


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
  const t = await getTranslations();
  const columns = getColumns(params.locale, t);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('Pages.Courses.Title')}</h1>
        <Link href={`${base}/courses/new`}>
          <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{t('Pages.Courses.Add')}</span>
        </Link>
      </div>

      {data.length === 0 ? (
        <p className="text-muted-foreground">{t('Pages.Courses.NoData')}</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
