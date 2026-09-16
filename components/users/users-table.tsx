"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Phone, MoreHorizontal, Search, ChevronLeft, ChevronRight, UserPlus } from "lucide-react"

const PAGE_SIZE = 10

interface SectionOption {
  label: string
  value: string
}

interface UsersTableProps {
  users: any[]
  columns: ColumnDef<any, any>[]
  addHref: string
  addLabel: string
  editBase: string // e.g. "/admin/teachers" or "/admin/managers"
  sectionOptions?: SectionOption[]
  searchPlaceholder?: string
}

function UserCard({ user, editBase }: { user: any; editBase: string }) {
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "am"
  const editHref = `/${locale}${editBase}/${user.user_id}/edit`

  const deleteUser = async () => {
    const ok = confirm("Are you sure you want to delete this user?")
    if (!ok) return
    const res = await fetch(`/api/user/${user.user_id}`, { method: "DELETE" })
    if (res.ok) {
      window.location.reload()
    } else {
      alert("Failed to delete user")
    }
  }

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              {user.photo_url && <AvatarImage src={user.photo_url} alt={user.first_name || ""} />}
              <AvatarFallback>{(user.first_name?.[0] || "")}{(user.last_name?.[0] || "")}</AvatarFallback>
            </Avatar>
            <div className="font-semibold text-base">
              {user.first_name} {user.last_name}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={editHref}>Edit</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={deleteUser} className="text-destructive focus:text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          {user.phone_number && (
            <div className="flex items-center text-sm">
              <Phone className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <span>{user.phone_number}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function UsersTable({
  users,
  columns,
  addHref,
  addLabel,
  editBase,
  sectionOptions,
  searchPlaceholder = "ፈልግ በስም፣ ስልክ ወይም ዩዘርኔም...",
}: UsersTableProps) {
  const [search, setSearch] = useState("")
  const [section, setSection] = useState("all")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      const matchesSearch =
        !q ||
        [u.first_name, u.last_name, `${u.first_name || ""} ${u.last_name || ""}`, u.phone_number, u.tg_username]
          .some((v) => v && v.toLowerCase().includes(q))

      const matchesSection =
        !sectionOptions || section === "all" || (u.section_ids || []).includes(section)

      return matchesSearch && matchesSection
    })
  }, [users, search, section, sectionOptions])

  const table = useReactTable({
    data: filtered,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  })

  useEffect(() => {
    table.setPageIndex(0)
  }, [search, section, table])

  const pageIndex = table.getState().pagination.pageIndex
  const pageCount = table.getPageCount()
  const from = filtered.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1
  const to = Math.min(filtered.length, (pageIndex + 1) * PAGE_SIZE)

  return (
    <div className="space-y-4">
      {/* Toolbar: search + section filter + add button */}
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

        {sectionOptions && sectionOptions.length > 0 && (
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="w-[160px] shrink-0">
              <SelectValue placeholder="ክፍል ምረጥ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ሁሉም ክፍሎች</SelectItem>
              {sectionOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Link href={addHref} className="shrink-0">
          <Button size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            {addLabel}
          </Button>
        </Link>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No results found.
            </CardContent>
          </Card>
        ) : (
          table.getRowModel().rows.map((row) => (
            <UserCard key={row.original.user_id} user={row.original} editBase={editBase} />
          ))
        )}
      </div>

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
                  No results.
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
