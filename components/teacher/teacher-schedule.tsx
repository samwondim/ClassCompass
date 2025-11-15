'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { parse, format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface Schedule {
  id: number
  date: string
  course: {
    id: number
    course_name: string
    verse: string | null
  }
  section: {
    id: number
    section_name: string | null
  }
  time?: string // Optional, as it might not be in the API response
}

export function TeacherSchedule() {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSchedules = async () => {
    setLoading(true)
    try {

      const response = await fetch('/api/schedules')
      const result = await response.json()
      console.log('API Response:', result) // Debug: Log full response
      if (response.ok) {
        setSchedules(result.schedules || [])
      } else {
        throw new Error(result.error || 'Failed to fetch schedules')
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch schedules',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin border-4 border-sky-600 border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    )
  }

  // Sort schedules by date
  const sortedSchedules = [...schedules].sort((a, b) => {
    const dateA = parse(a.date, 'MMM dd, yyyy', new Date())
    const dateB = parse(b.date, 'MMM dd, yyyy', new Date())
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>My Teaching Schedule</CardTitle>
            <CardDescription>View all your scheduled classes</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{format(new Date(), 'MMMM dd, yyyy')}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            {sortedSchedules.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No scheduled classes found.
              </div>
            ) : (
              sortedSchedules.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3 mb-3 sm:mb-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-medium">
                      {parse(item.date, 'MMM dd, yyyy', new Date()).getDate()}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.course.course_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.date} • {item.time || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <Badge variant="outline" className="bg-sky-50">
                      {item.course.verse || 'No verse'}
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-50">
                      {item.section.section_name || 'N/A'}
                    </Badge>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
