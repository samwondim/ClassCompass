"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Calendar as CalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { Schedule } from "@/app/models/models";
import { useState } from "react";
import { EditScheduleDialog } from "@/components/edit-schedule-dialog";

const ActionCell = ({ schedule }: { schedule: Schedule }) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(schedule.schedule_id)}>Copy ID</DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowEditDialog(true); }}>
            Edit Schedule
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditScheduleDialog
        schedule={schedule}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
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
    cell: ({ row }) => <ActionCell schedule={row.original} />,
  },
];
