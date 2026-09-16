"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react"

const PAGE_SIZE = 4

interface FilterOption {
  label: string
  value: string
}

function getByPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj)
}

interface PaginatedTableProps {
  items: any[]
  columns: ColumnDef<any, any>[]
  idKey: string
  searchKeys: string[]
  cardComponent?: React.ComponentType<{ item: any }>
  searchPlaceholder?: string
  emptyMessage?: string
  filterOptions?: FilterOption[]
  filterPlaceholder?: string
  filterKey?: string
  addHref?: string
  addLabel?: string
}

export function PaginatedTable({
  items,
  columns,
  idKey,
  searchKeys,
  cardComponent: CardComponent,
  searchPlaceholder = "ፈልግ...",
  emptyMessage = "No results.",
  filterOptions,
  filterPlaceholder = "ምረጥ",
  filterKey,
  addHref,
  addLabel,
}: PaginatedTableProps) {
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((item) => {
      const searchText = searchKeys
        .map((k) => getByPath(item, k))
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const matchesSearch = !q || searchText.includes(q)

      const matchesFilter =
        !filterOptions || !filterKey || filter === "all" || getByPath(item, filterKey) === filter

      return matchesSearch && matchesFilter
    })
  }, [items, search, filter, searchKeys, filterOptions, filterKey])

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  })

  useEffect(() => {
    table.setPageIndex(0)
  }, [search, filter, table])

  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()
  const from = filtered.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1
  const to = Math.min(filtered.length, (pageIndex + 1) * PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>

        {filterOptions && filterOptions.length > 0 && (
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[160px] shrink-0">
              <SelectValue placeholder={filterPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ሁሉም</SelectItem>
              {filterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {addHref && addLabel && (
          <Link href={addHref} className="shrink-0">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {addLabel}
            </Button>
          </Link>
        )}
      </div>

      {/* Mobile Card View */}
      {CardComponent && (
        <div className="md:hidden">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">{emptyMessage}</CardContent>
            </Card>
          ) : (
            table.getRowModel().rows.map((row) => (
              <CardComponent key={getByPath(row.original, idKey)} item={row.original} />
            ))
          )}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {from}–{to} ከ {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {pageIndex + 1} / {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
