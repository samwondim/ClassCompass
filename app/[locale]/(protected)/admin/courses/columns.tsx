'use client';

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, BookOpen as BookIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Course } from "@/app/models/models";
import { usePathname } from "next/navigation";
import Link from "next/link";

const ActionCell = ({ course, t }: { course: Course; t: any }) => {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/admin/courses/${course.course_id}/edit`;

  const handleDelete = async () => {
    if (!confirm(t('Pages.Courses.DeleteConfirm'))) return;
    try {
      const res = await fetch(`/api/courses/${course.course_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        window.location.reload();
      } else {
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
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(course.course_id)}>
          {t('Common.CopyId')}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={editHref}>{t('Common.Edit')}</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
          {t('Common.Delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function getColumns(locale: string, t: any): ColumnDef<Course>[] {
  return [
    {
      accessorKey: "course_name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(column.getIsSorted() === "asc")
          }
        >
          {t('Columns.CourseName')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium flex items-center">
          <BookIcon className="inline h-4 w-4 mr-1 text-primary" />
          {row.getValue("course_name") || <span className="text-muted-foreground italic">{t('Columns.Untitled')}</span>}
        </div>
      ),
    },
    {
      accessorKey: "verse",
      header: t('Columns.KeyVerse'),
      cell: ({ row }) => (
        <div className="italic text-muted-foreground">
          {row.getValue("verse") || "-"}
        </div>
      ),
    },
    {
      accessorKey: "course_description",
      header: t('Columns.Description'),
      cell: ({ row }) => (
        <div className="max-w-xs truncate" title={row.getValue("course_description")}>
          {row.getValue("course_description")}
        </div>
      ),
    },
    {
      accessorKey: "objectives",
      header: t('Columns.Objectives'),
      cell: ({ row }) => {
        const objectives = row.original.objectives || [];
        return (
          <div className="flex flex-col gap-1">
            {objectives.length === 0 ? (
              <Badge variant="outline">{t('Columns.NoObjectives')}</Badge>
            ) : (
              objectives.map((obj) => (
                <Badge key={obj.id} variant="outline">
                  {obj.objective}
                </Badge>
              ))
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_by_user",
      header: t('Columns.CreatedBy'),
      cell: ({ row }) => {
        const creator = row.original.created_by_user;
        if (!creator) return <div>{t('Columns.Unknown')}</div>;
        return <div>{`${creator.first_name} ${creator.last_name}`}</div>;
      },
    },
    {
      id: "actions",
      header: t('Columns.Actions'),
      cell: ({ row }) => <ActionCell course={row.original} t={t} />,
    },
  ];
}
