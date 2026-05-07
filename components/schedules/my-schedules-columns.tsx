"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Calendar, BookOpen, Layers, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Schedule } from "@/app/models/models";

// ─── Course Detail Dialog ────────────────────────────────────────────────────
function CourseDetailDialog({ schedule }: { schedule: Schedule }) {
  const course = schedule.course;
  const displayName = course.course_name || course.course_description || "ስም የሌለው ትምህርት";
  const showDescription =
    course.course_name &&
    course.course_description &&
    course.course_name !== course.course_description;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">ዝርዝር እይታ</span>
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-5 w-5 text-sky-600 flex-shrink-0" />
            {displayName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Date & Section meta */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(schedule.schedule_date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {" · "}
              {new Date(schedule.schedule_date).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })}
            </span>
            {schedule.section?.section_name && (
              <Badge variant="secondary" className="gap-1">
                <Layers className="h-3 w-3" />
                {schedule.section.section_name}
              </Badge>
            )}
          </div>

          {/* Verse */}
          {course.verse && (
            <blockquote className="border-l-2 border-sky-400 pl-3 italic text-sm text-muted-foreground">
              "{course.verse}"
            </blockquote>
          )}

          {/* Full description (only when different from name) */}
          {showDescription && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                መግለጫ
              </p>
              <p className="text-sm">{course.course_description}</p>
            </div>
          )}

          {/* Objectives */}
          {course.objectives && course.objectives.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                ዓላማዎች
              </p>
              <ul className="space-y-1.5">
                {course.objectives.map((obj) => (
                  <li key={obj.id} className="flex items-start gap-2 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                    {obj.objective}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Columns ─────────────────────────────────────────────────────────────────
export const myScheduleColumns: ColumnDef<Schedule>[] = [
  {
    accessorKey: "schedule_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ቀን
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        <Calendar className="inline h-4 w-4 mr-1 text-sky-600" />
        {new Date(row.getValue("schedule_date")).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>
    ),
    sortingFn: "datetime",
  },
  {
    accessorKey: "schedule_date",
    id: "time",
    header: "ሰዓት",
    cell: ({ row }) => (
      <div className="text-sm">
        {new Date(row.getValue("schedule_date")).toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
    ),
  },
  {
    id: "course",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ትምህርት
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const course = row.original.course;
      const displayName =
        course.course_name || course.course_description || "ስም የሌለው ትምህርት";
      return (
        <div className="max-w-xs">
          <div className="flex items-center font-medium">
            <BookOpen className="inline h-4 w-4 mr-1 text-sky-600 flex-shrink-0" />
            <span className="truncate">{displayName}</span>
          </div>
          {course.verse && (
            <div className="text-xs text-muted-foreground italic mt-0.5 pl-5 truncate">
              {course.verse}
            </div>
          )}
          {course.objectives && course.objectives.length > 0 && (
            <div className="text-xs text-muted-foreground mt-0.5 pl-5">
              {course.objectives.length} ዓላማ{course.objectives.length !== 1 ? "ዎች" : ""}
            </div>
          )}
        </div>
      );
    },
  },
  {
    id: "section",
    header: "ክፍል",
    cell: ({ row }) => {
      const sectionName = row.original.section?.section_name;
      return sectionName ? (
        <Badge variant="secondary" className="text-xs gap-1">
          <Layers className="h-3 w-3" />
          {sectionName}
        </Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => <CourseDetailDialog schedule={row.original} />,
  },
];
