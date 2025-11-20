"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, BookOpen as BookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/app/models/models";

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "course_description",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Description
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium max-w-md truncate">
        <BookIcon className="inline h-4 w-4 mr-1" />
        {row.getValue("course_description")}
      </div>
    ),
  },
  {
    accessorKey: "objectives",
    header: "Objectives",
    cell: ({ row }) => (
      <Badge variant="outline">{(row.original.objectives?.length || 0)} objectives</Badge>
    ),
  },
  {
    accessorKey: "created_by_user.first_name",
    header: "Created By",
    cell: ({ row }) => {
      const first = row.original.created_by_user.first_name;
      const last = row.original.created_by_user.last_name;
      return <div>{`${first} ${last}`}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem>View Details</DropdownMenuItem>
          <DropdownMenuItem>Edit Course</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
