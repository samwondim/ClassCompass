import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Calendar as CalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from 'date-fns';
import { Schedule } from "@/app/models/models";
import { ActionCell } from "./ActionCell";

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
