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

const TeacherActions = ({ teacherId, t }: { teacherId: string; t: any }) => {
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
          <Link href={editHref}>{t('Common.Edit')}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function getColumns(locale: string, t: any): ColumnDef<Teacher>[] {
  return [
    {
      accessorKey: "first_name",
      header: t('Columns.FirstName'),
    },
    {
      accessorKey: "last_name",
      header: t('Columns.LastName'),
    },
    {
      accessorKey: "tg_username",
      header: t('Columns.TelegramUsername'),
    },
    {
      accessorKey: "phone_number",
      header: t('Columns.PhoneNumber'),
    },
    {
      accessorKey: "sections",
      header: t('Columns.Section'),
    },
    {
      id: "actions",
      header: t('Columns.Actions'),
      cell: ({ row }) => {
        const teacher = row.original;

        const deleteUser = async () => {
          const ok = confirm(t('Pages.Teachers.DeleteConfirm'));
          if (!ok) return;

          const res = await fetch(`/api/user/${teacher.user_id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            window.location.reload();
          } else {
            alert(t('Delete.Failed'));
          }
        };

        return (
          <div className="flex items-center gap-2">
            <TeacherActions teacherId={teacher.user_id} t={t} />
            <Button variant="ghost" className="h-8 px-2 text-destructive" onClick={deleteUser}>
              {t('Common.Delete')}
            </Button>
          </div>
        );
      },
    },
  ];
}
