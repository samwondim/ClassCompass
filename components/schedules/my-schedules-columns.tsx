"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Calendar, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Schedule } from "@/app/models/models";

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
      const displayName = course.course_name || course.course_description || "ስም የሌለው ትምህርት";
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
];

