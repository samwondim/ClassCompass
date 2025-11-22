// components/teacher/columns.tsx (or app/(protected)/teacher/schedules/columns.tsx)
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScheduleWithRelations } from "@/app/models/models"; // Adjust import for your types

export const columns: ColumnDef<ScheduleWithRelations>[] = [
  // Date
  {
    accessorKey: "schedule_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
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
  // Time
  {
    accessorKey: "schedule_date",
    header: "Time",
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
  // Course Description
  {
    accessorKey: "course.course_description",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Course
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium max-w-md truncate">
        <BookOpen className="inline h-4 w-4 mr-1 text-sky-600" />
        {row.original.course.course_description || "Untitled Course"}
      </div>
    ),
  },
  // Sections (from teacher_sections)
  {
    id: "sections",
    header: "Sections",
    cell: ({ row }) => {
      const sections = row.original.teacher_sections.map((ts) => ts.section.section_name);
      return (
        <div className="flex flex-wrap gap-1">
          {sections.map((section, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {section}
            </Badge>
          ))}
        </div>
      );
    },
  },
  // Objectives Count
  {
    id: "objectives",
    header: "Objectives",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs">
        {row.original.course.objectives.length} objectives
      </Badge>
    ),
  },
  // Actions
  {
    id: "actions",
    cell: ({ row }) => {
      const schedule = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
