"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Calendar as CalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { Schedule } from "@/app/models/models";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ActionCell = ({ schedule, t }: { schedule: Schedule; t: any }) => {
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

export function getColumns(locale: string, t: any): ColumnDef<Schedule>[] {
  return [
    {
      accessorKey: "schedule_date",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          {t('Columns.Date')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium">
          <CalIcon className="inline h-4 w-4 mr-1" />
          {(() => {
            const dateVal = row.getValue("schedule_date");
            const date = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal as Date;
            return format(date, 'MMM dd, yyyy h:mm a');
          })()}
        </div>
      ),
    },
    {
      accessorKey: "course.course_description",
      header: t('Columns.Course'),
      cell: ({ row }) => <Badge variant="outline">{row.original.course.course_description || t('Columns.Untitled')}</Badge>,
    },
    {
      accessorKey: "teacher.first_name",
      header: t('Columns.Teacher'),
      cell: ({ row }) => {
        const first = row.original.teacher.first_name;
        const last = row.original.teacher.last_name;
        return <div className="font-medium">{`${first} ${last}`}</div>;
      },
    },
    {
      id: "actions",
      header: t('Columns.Actions'),
      cell: ({ row }) => <ActionCell schedule={row.original} t={t} />,
    },
  ];
}
