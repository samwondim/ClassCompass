"use client"

import { useRouter } from "next/navigation"
import { ChevronRight, BookOpen, Layers, Calendar } from "lucide-react"
import { Schedule } from "@/app/models/models"

export function TeacherSchedulesTable({ schedules, basePath }: { schedules: Schedule[]; basePath: string }) {
  const router = useRouter()

  if (schedules.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center text-muted-foreground">
        ምንም መርሃ ግብር አልተገኘም።
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">ትምህርት</th>
            <th className="px-4 py-3 text-left font-medium">ክፍል</th>
            <th className="px-4 py-3 text-left font-medium">ቀን</th>
            <th className="w-10 px-2 py-3" />
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <tr
              key={s.schedule_id}
              onClick={() => router.push(`${basePath}/schedules/${s.schedule_id}`)}
              className="cursor-pointer border-t transition hover:bg-muted/50"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 font-medium">
                  <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                  <span
                    className="truncate"
                    title={s.course.course_name || s.course.course_description || ""}
                  >
                    {(() => {
                      const title = s.course.course_name || s.course.course_description || "ስም የሌለው ትምህርት";
                      return title.length > 5 ? `${title.slice(0, 5)}...` : title;
                    })()}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {s.section?.section_name ? (
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5" />
                    {s.section.section_name}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(s.schedule_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </td>
              <td className="px-2 py-3">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
