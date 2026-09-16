"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Calendar, BookOpen, User, MoreHorizontal } from "lucide-react"
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
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center text-sm font-medium">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            {new Date(schedule.schedule_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
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

        <div className="space-y-2">
          <div className="flex items-start">
            <BookOpen className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="font-semibold text-sm">
              {schedule.course.course_name || schedule.course.course_description}
            </div>
          </div>
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
            <span className="text-sm">{schedule.teacher.first_name} {schedule.teacher.last_name}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
