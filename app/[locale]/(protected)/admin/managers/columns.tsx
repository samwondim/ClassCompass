"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Manager } from "@/app/models/models"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ManagerActions = ({ managerId }: { managerId: string }) => {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/admin/managers/${managerId}/edit`;

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

export const columns: ColumnDef<Manager>[] = [
  {
    id: "name",
    header: "ስም",
    cell: ({ row }) => {
      const { first_name, last_name, photo_url } = row.original;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {photo_url && <AvatarImage src={photo_url} alt={first_name || ""} />}
            <AvatarFallback>{(first_name?.[0] || "")}{(last_name?.[0] || "")}</AvatarFallback>
          </Avatar>
          <span>{[first_name, last_name].filter(Boolean).join(" ")}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "phone_number",
    header: "የስልክ ቁጥር",
  },
  {
    id: "actions",
    header: "ተጨማሪ ተግባራት",
    cell: ({ row }) => {
      const manager = row.original;

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
        <div className="flex items-center gap-2">
          <ManagerActions managerId={manager.user_id} />
          <Button variant="ghost" className="h-8 px-2 text-destructive" onClick={deleteUser}>
            አጥፋ
          </Button>
        </div>
      );
    },
  },
];
