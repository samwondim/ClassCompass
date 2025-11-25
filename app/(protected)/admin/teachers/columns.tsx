
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Teacher } from "@/app/models/models"
import { deleteUser } from "@/app/actions/users";
import { useState } from "react";


export const columns: ColumnDef<Teacher>[] = [
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    accessorKey: "sections",
    header: "Section",
  },
  {

    id: "actions",
    cell: ({ row }) => {
      const schedule = row.original;
      const [formData, setFormData] = useState({ user_id: "" });

      const handleSubmit = async (e: any) => {
        e.preventDefault();

        const res = await fetch("/api/user", {
          method: "POST",
          body: JSON.stringify(formData),
          headers: { "Content-Type": "application/json" },
        });

      }
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive focus:text-destructive"><form onSubmit={deleteUser} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}><button>Delete</button></form></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
  },
]
