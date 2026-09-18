import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, BookOpen, Layers, Quote, Target, ChevronLeft, Clock, Users, Paperclip, ExternalLink, FileText } from "lucide-react";
import { Schedule, LessonPlan } from "@/app/models/models";

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

  const planSections: { key: keyof LessonPlan; label: string }[] = [
    { key: "opening", label: "መግቢያ" },
    { key: "teaching", label: "ትምህርት" },
    { key: "application", label: "ተግባራዊ አተገባበር" },
    { key: "activity", label: "እንቅስቃሴ" },
    { key: "memory_verse", label: "የማስታወስ ጥቅስ" },
    { key: "closing", label: "መደምደሚያ" },
  ];
  const planEntries = planSections.filter((s) => course.lesson_plan?.[s.key]);

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
            {course.unit?.title && (
              <Badge variant="outline" className="gap-1">
                <BookOpen className="h-3 w-3" />
                {course.unit.title}
              </Badge>
            )}
            {course.age_group && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {course.age_group}
              </span>
            )}
            {course.duration_minutes && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {course.duration_minutes} ደቂቃ
              </span>
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

        {/* Lesson plan */}
        {planEntries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                የትምህርቱ እቅድ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                {planEntries.map((section) => (
                  <div key={section.key}>
                    <dt className="text-sm font-semibold text-primary">{section.label}</dt>
                    <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {course.lesson_plan?.[section.key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}

        {/* Resources / materials */}
        {course.resources && course.resources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Paperclip className="h-5 w-5 text-primary" />
                መማሪያዎች
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {course.resources.map((resource) => (
                  <li key={resource.resource_id}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      {resource.type === "LINK" ? (
                        <ExternalLink className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {resource.title}
                    </a>
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
