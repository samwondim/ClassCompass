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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TeacherActions = ({ teacherId }: { teacherId: string }) => {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/admin/teachers/${teacherId}/edit`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={editHref}>መረጃ አስተካክል</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const columns: ColumnDef<Teacher>[] = [
  {
    accessorKey: "first_name",
    header: "ስም",
    cell: ({ row }) => {
      const { first_name, last_name, photo_url } = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {photo_url && <AvatarImage src={photo_url} alt={first_name || ""} />}
            <AvatarFallback>{(first_name?.[0] || "")}{(last_name?.[0] || "")}</AvatarFallback>
          </Avatar>
          <span>{first_name}</span>
        </div>
      );
    }
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
        <div className="flex items-center gap-2">
          <TeacherActions teacherId={teacher.user_id} />
          <Button variant="ghost" className="h-8 px-2 text-destructive" onClick={deleteUser}>
            አጥፋ
          </Button>
        </div>
      );
    },
  },
];
