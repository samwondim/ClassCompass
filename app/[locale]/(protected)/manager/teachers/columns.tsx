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
import { usePathname } from "next/navigation";
import Link from "next/link";

const TeacherActions = ({ teacherId }: { teacherId: string }) => {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/manager/teachers/${teacherId}/edit`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={editHref}>Edit</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

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
  },
  {
    id: "actions",
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
        <div className="flex items-center gap-2">
          <TeacherActions teacherId={teacher.user_id} />
          <Button variant="ghost" className="h-8 px-2 text-destructive" onClick={deleteUser}>
            Delete
          </Button>
        </div>
      );
    },
  },
];
