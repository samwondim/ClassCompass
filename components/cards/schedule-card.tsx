"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, User, Layers, MoreHorizontal } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Schedule } from "@/app/models/models"

export function ScheduleCard({ item: schedule }: { item: Schedule }) {
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "am"
  const role = pathname?.includes("/admin") ? "admin" : "manager"
  const editHref = `/${locale}/${role}/schedules/${schedule.schedule_id}/edit`

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this schedule?")) return
    const res = await fetch(`/api/schedules/${schedule.schedule_id}`, { method: "DELETE" })
    if (res.ok) window.location.reload()
    else alert("Failed to delete")
  }

  return (
    <div className="mb-3 flex gap-3 rounded-2xl border border-l-[3px] border-l-primary bg-card p-3.5">
      <div className="flex-1 min-w-0">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-primary">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(schedule.schedule_date).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
          {" ● "}
          {new Date(schedule.schedule_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
        </div>
        <p className="mb-1 truncate text-[14.5px] font-bold">
          {schedule.course.course_name || schedule.course.course_description}
        </p>
        <div className="flex items-center gap-3 text-[12.5px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {schedule.teacher.first_name} {schedule.teacher.last_name}
          </span>
          {schedule.section?.section_name && (
            <span className="flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {schedule.section.section_name}
            </span>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-[30px] w-[30px] flex-shrink-0 p-0 text-muted-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={editHref}>Edit</Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
