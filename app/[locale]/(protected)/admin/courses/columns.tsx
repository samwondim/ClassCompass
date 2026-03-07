'use client';

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, BookOpen as BookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/app/models/models";
import { EditCourseDialog } from "@/components/edit-course-dialog";
import { useState } from "react";

const ActionCell = ({ course }: { course: Course }) => {
  const [showEditDialog, setShowEditDialog] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/courses/${course.course_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        window.location.reload();
      } else {
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
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(course.course_id)}>
            Copy ID
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setShowEditDialog(true); }}>
            Edit Course
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditCourseDialog
        course={course}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
      />
    </>
  );
};

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "course_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        የትምህርት ዓርዕሥ
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium flex items-center">
        <BookIcon className="inline h-4 w-4 mr-1 text-primary" />
        {row.getValue("course_name") || <span className="text-muted-foreground italic">Untitled</span>}
      </div>
    ),
  },
  {
    accessorKey: "verse",
    header: "መሪ ጥቅሥ",
    cell: ({ row }) => (
      <div className="italic text-muted-foreground">
        {row.getValue("verse") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "course_description",
    header: "ስለ ትምህርቱ አጭርር ማብራርያ",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.getValue("course_description")}>
        {row.getValue("course_description")}
      </div>
    ),
  },
  {
    accessorKey: "objectives",
    header: "የትምህርቱ አላማዎች / ተማሪዎች እንዲገነዘቡ ሚፈለጉ ነገሮች ",
    cell: ({ row }) => {
      const objectives = row.original.objectives || [];
      return (
        <div className="flex flex-col gap-1">
          {objectives.length === 0 ? (
            <Badge variant="outline">No objectives</Badge>
          ) : (
            objectives.map((obj) => (
              <Badge key={obj.id} variant="outline">
                {obj.objective}
              </Badge>
            ))
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "created_by_user",
    header: "ትምህርቱን የመዘገበው አካል",
    cell: ({ row }) => {
      const creator = row.original.created_by_user;
      if (!creator) return <div>Unknown</div>;
      return <div>{`${creator.first_name} ${creator.last_name}`}</div>;
    },
  },
  {
    id: "actions",
    header: "ተጨማሪ ተግባራት",
    cell: ({ row }) => <ActionCell course={row.original} />,
  },
];
