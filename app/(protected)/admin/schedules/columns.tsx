"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Calendar as CalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { Schedule } from "@/app/models/models";
import { parse } from "path";

export const columns: ColumnDef<Schedule>[] = [
  {
    accessorKey: "schedule_date",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        <CalIcon className="inline h-4 w-4 mr-1" />
        {format(parseISO(row.getValue("schedule_date")), 'MMM dd, yyyy h:mm a')}
      </div>
    ),
  },
  {
    accessorKey: "course.course_description",
    header: "Course",
    cell: ({ row }) => <Badge variant="outline">{row.original.course.course_description || 'Untitled'}</Badge>,
  },
  {
    accessorKey: "teacher.first_name",
    header: "Teacher",
    cell: ({ row }) => {
      const first = row.original.teacher.first_name;
      const last = row.original.teacher.last_name;
      return <div className="font-medium">{`${first} ${last}`}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const schedule = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
