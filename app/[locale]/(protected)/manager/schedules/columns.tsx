"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Calendar as CalIcon, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { Schedule } from "@/app/models/models";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ActionCell = ({ schedule }: { schedule: Schedule }) => {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/manager/schedules/${schedule.schedule_id}/edit`;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const res = await fetch(`/api/schedules/${schedule.schedule_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        window.location.reload();
      } else {
        console.error("Failed to delete");
        alert("Failed to delete");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(schedule.schedule_id)}>Copy ID</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={editHref}>Edit Schedule</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
        {(() => {
          const dateVal = row.getValue("schedule_date");
          const date = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal as Date;
          return format(date, 'MMM dd, yyyy h:mm a');
        })()}
      </div>
    ),
  },
  {
    accessorKey: "course",
    header: "Course",
    cell: ({ row }) => {
      const course = row.original.course;
      return (
        <div className="flex flex-col">
          <span className="font-semibold flex items-center">
            <BookOpen className="w-3 h-3 mr-1 text-primary" />
            {course.course_name || course.course_description}
          </span>
          {course.verse && <span className="text-xs text-muted-foreground italic">{course.verse}</span>}
        </div>
      );
    },
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
    cell: ({ row }) => <ActionCell schedule={row.original} />,
  },
];
