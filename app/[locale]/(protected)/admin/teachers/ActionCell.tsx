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
import Link from "next/link";

export const ActionCell = ({ teacher, locale, t }: { teacher: Teacher, locale: string, t: (key: string) => string }) => {
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/admin/teachers/${teacher.user_id}/edit`}>{t('Common.Edit')}</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" className="h-8 px-2 text-destructive" onClick={deleteUser}>
        {t('Common.Delete')}
      </Button>
    </div>
  );
};
