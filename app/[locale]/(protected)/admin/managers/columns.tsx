"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Manager } from "@/app/models/models"
import EditManagerForm from "./EditManagerForm";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { Badge } from "@/components/ui/badge";
export const columns: ColumnDef<Manager>[] = [
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    accessorKey: "tg_username",
    header: "Telegram Username",
  },

  {
    accessorKey: "phone_number",
    header: "Phone Number",
  },
  {
    accessorKey: "sections",
    header: "Section",
    cell: ({ row }) => {
      if (!row.original.sections || row.original.sections.length === 0) {
        return <Badge variant="outline">No Sections Assigned</Badge>
      }
      return <>
        {row.original.sections?.map(section => <Badge key={section.section_id} variant="outline">{section.section_name}</Badge>)}
      </>
    },
  },
  {

    id: "actions",
    cell: ({ row }) => {
      const manager = row.original;


      // DELETE ACTION
      const deleteUser = async () => {
        const ok = confirm("Are you sure?");
        if (!ok) return;

        const res = await fetch(`/api/user/${manager.user_id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          window.location.reload();
        } else {
          alert("Failed to delete user");
        }
      };
      return (
        <Dialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {/* EDIT */}
              <DialogTrigger asChild>
                <DropdownMenuItem>Edit</DropdownMenuItem>
              </DialogTrigger>

              <DropdownMenuItem
                onClick={deleteUser}
                className="text-destructive focus:text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* MODAL CONTENT */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
            </DialogHeader>

            <EditManagerForm manager={manager} onClose={() => { }} />
          </DialogContent>
        </Dialog>
      );
    },
  }
]
