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
import { Calendar, BookOpen, User, Layers } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Schedule } from "@/app/models/models"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

function ScheduleCard({ schedule }: { schedule: Schedule }) {
  const dateVal = schedule.schedule_date;
  const date = typeof dateVal === 'string' ? parseISO(dateVal) : dateVal as Date;

  const sectionName = schedule.section?.section_name;
  const course = schedule.course;
  const displayName = course.course_name || course.course_description;
  const showDescription = course.course_name && course.course_description && course.course_name !== course.course_description;

  return (
    <Card className="mb-3">
      <CardContent className="p-4 space-y-3">
        {/* Date / Time header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm font-medium">
            <Calendar className="h-4 w-4 mr-2 text-primary" />
            {format(date, 'MMM dd, yyyy')}
          </div>
          <span className="text-xs text-muted-foreground">{format(date, 'h:mm a')}</span>
        </div>

        {/* Section badge */}
        {sectionName && (
          <div className="flex items-center gap-1">
            <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              {sectionName}
            </span>
          </div>
        )}

        {/* Course details */}
        <div className="border-l-2 border-sky-400 pl-3 space-y-1">
          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 mt-0.5 text-sky-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{displayName}</span>
          </div>
          {/* Course description (only when different from course_name) */}
          {showDescription && (
            <p className="text-xs text-muted-foreground pl-6">{course.course_description}</p>
          )}
          {/* Verse */}
          {course.verse && (
            <p className="text-xs italic text-muted-foreground pl-6">"{course.verse}"</p>
          )}
        </div>

        {/* Objectives */}
        {course.objectives && course.objectives.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ዓላማዎች</p>
            <ul className="space-y-1">
              {course.objectives.map((obj) => (
                <li key={obj.id} className="flex items-start gap-2 text-xs text-foreground">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-500 flex-shrink-0" />
                  {obj.objective}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MySchedulesTable<TData, TValue>({
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
      <div className="md:hidden">
        {data.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              ምንም መርሃ ግብር አልተገኘም።
            </CardContent>
          </Card>
        ) : (
          data.map((item) => (
            <ScheduleCard key={(item as any).schedule_id} schedule={item as any} />
          ))
        )}
      </div>

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
                  ምንም ውጤት የለም።
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
