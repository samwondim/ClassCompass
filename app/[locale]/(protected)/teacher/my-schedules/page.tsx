// app/(protected)/teacher/my-schedules/page.tsx
import { TeacherSchedulesTable } from '@/components/schedules/teacher-schedules-table';
import { Schedule } from '@/app/models/models';
import { cookies } from "next/headers";

async function getMySchedules(): Promise<Schedule[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};

    const res = await fetch(`${baseUrl}/api/schedules/my`, {
      cache: 'no-store',
      headers,
    });

    if (!res.ok) {
      console.error('Failed to fetch schedules', res.status, await res.text());
      return [];
    }

    const { schedules } = await res.json();
    return schedules || [];
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

export default async function TeacherSchedulesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const schedules = await getMySchedules();
  const basePath = `/${locale}/teacher`;

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-primary mb-6">የኔ መርሃ ግብሮች</h1>
      <TeacherSchedulesTable schedules={schedules} basePath={basePath} />
    </div>
  );
}
