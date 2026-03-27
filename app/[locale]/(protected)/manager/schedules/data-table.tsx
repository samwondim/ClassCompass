
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
import { Calendar, BookOpen, User } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Schedule } from "@/app/models/models"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

// Mobile Card Component for Schedules
function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/manager/schedules/${schedule.schedule_id}/edit`;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    try {
      const res = await fetch(`/api/schedules/${schedule.schedule_id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert("Failed to delete");
      }
    } catch (e) {
      alert("Error deleting");
    }
  };

  const dateVal = schedule.schedule_date;
  const date = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal as Date;

  return (
    <>
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center text-sm font-medium">
              <Calendar className="h-4 w-4 mr-2 text-primary" />
              {format(date, 'MMM dd, yyyy h:mm a')}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(schedule.schedule_id)}>
                  Copy ID
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={editHref}>Edit Schedule</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-2">
            <div className="flex items-start">
              <BookOpen className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-semibold">{schedule.course.course_name || schedule.course.course_description}</div>
                {schedule.course.verse && (
                  <div className="text-xs text-muted-foreground italic">{schedule.course.verse}</div>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
              <span className="text-sm">{schedule.teacher.first_name} {schedule.teacher.last_name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

    </>
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
              No schedules found.
            </CardContent>
          </Card>
        ) : (
          data.map((item) => (
            <ScheduleCard key={(item as any).schedule_id} schedule={item as any} />
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
