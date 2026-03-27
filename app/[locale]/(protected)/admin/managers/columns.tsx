import { ColumnDef } from "@tanstack/react-table"
import { Manager } from "@/app/models/models"
import { Badge } from "@/components/ui/badge";
import { ManagerActions } from "./ManagerActions";

export function getColumns(locale: string, t: any): ColumnDef<Manager>[] {
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
      cell: ({ row }) => {
        if (!row.original.sections) {
          return <Badge variant="outline">{t('Columns.NoSections')}</Badge>
        }
        return <>
          {row.original.sections?.map((section: any) => <Badge key={section.section_id} variant="outline">{section.section_name}</Badge>)}
        </>
      },
    },
    {
      id: "actions",
      header: t('Columns.Actions'),
      cell: ({ row }) => <ManagerActions manager={row.original} t={t} />,
    }
  ];
}
