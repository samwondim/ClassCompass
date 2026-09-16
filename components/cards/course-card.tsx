"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { BookOpen, MoreHorizontal, Quote, Target } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Course } from "@/app/models/models"

export function CourseCard({ item: course }: { item: Course }) {
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "am"
  const role = pathname?.includes("/admin") ? "admin" : "manager"
  const editHref = `/${locale}/${role}/courses/${course.course_id}/edit`

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course?")) return
    const res = await fetch(`/api/courses/${course.course_id}`, { method: "DELETE" })
    if (res.ok) window.location.reload()
    else alert("Failed to delete")
  }

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-start flex-1">
            <BookOpen className="h-5 w-5 mr-2 mt-0.5 text-primary flex-shrink-0" />
            <div className="font-semibold text-base">
              {course.course_name || <span className="text-muted-foreground italic">Untitled</span>}
            </div>
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
          {course.verse && (
            <div className="flex items-start text-sm">
              <Quote className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
              <span className="italic text-muted-foreground">{course.verse}</span>
            </div>
          )}
          {course.course_description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{course.course_description}</p>
          )}
          {course.objectives && course.objectives.length > 0 && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Target className="h-3.5 w-3.5 mr-1" />
              {course.objectives.length} ዓላማ{course.objectives.length !== 1 ? "ዎች" : ""}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
