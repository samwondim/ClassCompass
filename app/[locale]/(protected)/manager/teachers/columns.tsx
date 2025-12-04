
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Teacher } from "@/app/models/models"

export const columns: ColumnDef<Teacher>[] = [
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    accessorKey: "sections",
    header: "Section",
  },
]
