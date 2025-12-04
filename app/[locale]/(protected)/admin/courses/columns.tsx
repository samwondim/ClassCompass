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

export const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "course_description",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() =>
          column.toggleSorting(column.getIsSorted() === "asc")
        }
      >
        Description
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium max-w-md truncate flex items-center">
        <BookIcon className="inline h-4 w-4 mr-1" />
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
