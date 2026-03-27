"use client"

import { CalendarIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ScheduleCalendar() {
  const currentDate = new Date()
  const currentMonth = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })


  return (
    <Card>
      <CardHeader className="flex flex-row items-center">
        <div className="flex-1">
          <CardTitle>Schedule Calendar</CardTitle>
          <CardDescription>View and manage teaching assignments</CardDescription>
        </div>
        <div className="flex items-center gap-1 px-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{currentMonth}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <CalendarIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-sm">No Schedules Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Create your first schedule using the form above. Once you add teachers and schedules, they'll appear here.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
