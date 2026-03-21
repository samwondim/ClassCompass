"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Manager } from "@/app/models/models"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";

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
    cell: ({ row }) => {
      if (!row.original.sections) {
        return <Badge variant="outline">No Sections Assigned</Badge>
      }
      return <>
        {row.original.sections?.map(section => <Badge key={section.section_id} variant="outline">{section.section_name}</Badge>)}
      </>
    },
  },
  {

    id: "actions",
    header: "ተጨማሪ ተግባራት",
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
        <div className="flex items-center gap-2">
          <ManagerActions managerId={manager.user_id} />
          <Button variant="ghost" className="h-8 px-2 text-destructive" onClick={deleteUser}>
            አጥፋ
          </Button>
        </div>
      );
    },
  }
]
