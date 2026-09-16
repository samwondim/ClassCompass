import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Layers, Quote, Target, ChevronLeft } from "lucide-react";
import { Schedule } from "@/app/models/models";

async function getSchedule(id: string): Promise<Schedule | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";

    const session = (await cookies()).get("session")?.value;
    const headers: HeadersInit = session ? { cookie: `session=${session}` } : {};

    const res = await fetch(`${baseUrl}/api/schedules/${id}`, {
      cache: 'no-store',
      headers,
    });

    if (!res.ok) return null;

    const { schedule } = await res.json();
    return schedule || null;
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return null;
  }
}

export default async function TeacherScheduleDetailsPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const schedule = await getSchedule(id);

  if (!schedule) notFound();

  const course = schedule.course;
  const title = course.course_name || course.course_description || "ስም የሌለው ትምህርት";
  const showDescription = course.course_name && course.course_description && course.course_name !== course.course_description;

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <Link
        href={`/${locale}/teacher/my-schedules`}
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        ወደ መርሃ ግብሮች
      </Link>

      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            {title}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(schedule.schedule_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            {schedule.section?.section_name && (
              <Badge variant="secondary" className="gap-1">
                <Layers className="h-3 w-3" />
                {schedule.section.section_name}
              </Badge>
            )}
          </div>
        </div>

        {/* Verse */}
        {course.verse && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Quote className="h-5 w-5 text-primary" />
                መሪ ጥቅስ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground">
                "{course.verse}"
              </blockquote>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {showDescription && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">መግለጫ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{course.course_description}</p>
            </CardContent>
          </Card>
        )}

        {/* Objectives */}
        {course.objectives && course.objectives.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                ዓላማዎች
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {course.objectives.map((obj) => (
                  <li key={obj.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                    <span>{obj.objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
