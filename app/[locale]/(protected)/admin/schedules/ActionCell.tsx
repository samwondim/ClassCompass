"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Schedule } from "@/app/models/models";

export const ActionCell = ({ schedule, t }: { schedule: Schedule; t: any }) => {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/admin/schedules/${schedule.schedule_id}/edit`;

  const handleDelete = async () => {
    if (!confirm(t('Pages.Schedules.DeleteConfirm'))) return;
    try {
      const res = await fetch(`/api/schedules/${schedule.schedule_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        window.location.reload();
      } else {
        console.error(t('Delete.Failed'));
        alert(t('Delete.Failed'));
      }
    } catch (e) {
      console.error(e);
      alert(t('Delete.Failed'));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('Common.Actions')}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(schedule.schedule_id)}>{t('Common.CopyId')}</DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={editHref}>{t('Common.Edit')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">{t('Common.Delete')}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
