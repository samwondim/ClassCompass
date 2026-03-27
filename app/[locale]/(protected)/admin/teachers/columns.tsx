import { ColumnDef } from "@tanstack/react-table";
import { Teacher } from "@/app/models/models";
import { ActionCell } from "./ActionCell";

export const getColumns = (locale: string, t: (key: string) => string): ColumnDef<Teacher>[] => {
  return [
    {
      accessorKey: "first_name",
      header: () => t('Columns.FirstName'),
    },
    {
      accessorKey: "last_name",
      header: () => t('Columns.LastName'),
    },
    {
      accessorKey: "tg_username",
      header: () => t('Columns.TelegramUsername'),
    },
    {
      accessorKey: "phone_number",
      header: () => t('Columns.PhoneNumber'),
    },
    {
      accessorKey: "sections",
      header: () => t('Columns.Section'),
    },
    {
      id: "actions",
      header: () => t('Columns.Actions'),
      cell: ({ row }) => <ActionCell teacher={row.original} locale={locale} t={t} />,
    },
  ];
};

export const columns: ColumnDef<Teacher>[] = [];
