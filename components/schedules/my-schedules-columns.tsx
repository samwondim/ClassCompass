"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Calendar, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
    accessorKey: "course.course_description",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        ትምህርት
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium max-w-md truncate">
        <BookOpen className="inline h-4 w-4 mr-1 text-sky-600" />
        {row.original.course.course_description || "ስም የሌለው ትምህርት"}
      </div>
    ),
  },
  {
    id: "section",
    header: "ክፍል",
    cell: ({ row }) => {
      const sectionName = row.original.section?.section_name || "N/A";
      return (
        <Badge variant="secondary" className="text-xs">
          {sectionName}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: () => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">ምናሌ ክፈት</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>ተጨማሪ ተግባራት</DropdownMenuLabel>
            <DropdownMenuItem>ዝርዝር እይታ</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
