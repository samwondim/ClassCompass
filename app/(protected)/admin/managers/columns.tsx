"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Manager } from "@/app/models/models"

export const columns: ColumnDef<Manager>[] = [
  {
    accessorKey: "first_name",
    header: "First Name",
  },
  {
    accessorKey: "last_name",
    header: "Last Name",
  },
  {
    accessorKey: "sections_managed",
    header: "Section",
  },
]
