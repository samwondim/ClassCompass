
"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { User, Phone, MessageCircle, MapPin, MoreHorizontal } from "lucide-react"
import { Teacher } from "@/app/models/models"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import Link from "next/link"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

// Mobile Card Component for Teachers
function TeacherCard({ teacher }: { teacher: Teacher }) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/admin/teachers/${teacher.user_id}/edit`;
  const deleteUser = async () => {
    const ok = confirm("Are you sure you want to delete this teacher?");
    if (!ok) return;

    const res = await fetch(`/api/user/${teacher.user_id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert("Failed to delete user");
    }
  };

  return (
    <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center">
              <User className="h-5 w-5 mr-2 text-primary" />
              <div className="font-semibold text-base">
                {teacher.first_name} {teacher.last_name}
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
                <DropdownMenuItem
                  onClick={deleteUser}
                  className="text-destructive focus:text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            {teacher.phone_number && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span>{teacher.phone_number}</span>
              </div>
            )}

            {teacher.tg_username && (
              <div className="flex items-center text-sm">
                <MessageCircle className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span>@{teacher.tg_username}</span>
              </div>
            )}

            {teacher.sections && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                <span>{teacher.sections}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      </Card>
  );
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <>
      {/* Mobile Card View */}
      <div className="md:hidden">
        {data.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No teachers found.
            </CardContent>
          </Card>
        ) : (
          data.map((item) => (
            <TeacherCard key={(item as any).user_id} teacher={item as any} />
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
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
    </>
  )
}
