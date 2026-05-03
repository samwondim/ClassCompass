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
import { usePathname } from "next/navigation";
import Link from "next/link";

const ActionCell = ({ course }: { course: Course }) => {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/manager/courses/${course.course_id}/edit`;

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
        <DropdownMenuItem asChild>
          <Link href={editHref}>Edit Course</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
        Course Name
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
    header: "Key Verse",
    cell: ({ row }) => (
      <div className="italic text-muted-foreground">
        {row.getValue("verse") || "-"}
      </div>
    ),
  },
  {
    accessorKey: "course_description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-xs truncate" title={row.getValue("course_description")}>
        {row.getValue("course_description")}
      </div>
    ),
  },
  {
    accessorKey: "objectives",
    header: "Objectives",
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
    accessorKey: "section",
    header: "Section",
    cell: ({ row }) => {
      const section = row.original.section;
      return <div>{section?.section_name || "-"}</div>;
    },
  },
  {
    accessorKey: "created_by_user",
    header: "Created By",
    cell: ({ row }) => {
      const creator = row.original.created_by_user;
      if (!creator) return <div>Unknown</div>;
      return <div>{`${creator.first_name} ${creator.last_name}`}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell course={row.original} />,
  },
];
