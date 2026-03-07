"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Teacher } from "@/app/models/models";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,

} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import EditTeacherForm from "./EditTeacherForm";

export const columns: ColumnDef<Teacher>[] = [
  {
    accessorKey: "first_name",
    header: "ስም",
  },
  {
    accessorKey: "last_name",
    header: "የአባት ስም",
  },
  {
    accessorKey: "tg_username",
    header: "ተሌግራም ዩዘርኔም",
  },
  {
    accessorKey: "phone_number",
    header: "የስልክ ቁጥር",
  },
  {
    accessorKey: "sections",
    header: "ክፍል",
  },
  {
    id: "actions",
    header: "ተጨማሪ ተግባራት",
    cell: ({ row }) => {
      const teacher = row.original;

      // DELETE ACTION
      const deleteUser = async () => {
        const ok = confirm("Are you sure?");
        if (!ok) return;

        const res = await fetch(`/api/user/${teacher.user_id}`, {
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
                <DropdownMenuItem>መረጃ አስተካክል</DropdownMenuItem>
              </DialogTrigger>

              {/* DELETE */}
              <DropdownMenuItem
                onClick={deleteUser}
                className="text-destructive focus:text-destructive"
              >
                አጥፋ </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* MODAL CONTENT */}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
            </DialogHeader>

            <EditTeacherForm teacher={teacher} onClose={() => { }} />
          </DialogContent>
        </Dialog>
      );
    },
  },
];
