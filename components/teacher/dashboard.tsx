'use client'

import { useState, useEffect } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useToast from '@/hooks/use-toast'
import { useTelegram } from '@/components/telegram-provider'

// Types based on Prisma schema
interface Objective {
  id: string
  objective: string
}

interface Course {
  course_id: string
  course_name?: string | null
  course_description: string
  verse?: string | null
  created_at: Date
  objectives: Objective[]
}

interface Section {
  section_id: string
  section_name: string
}

interface Schedule {
  schedule_id: string
  course_id: string
  teacher_id: string
  created_at: Date
  updated_at: Date
  schedule_date: Date
  course: Course
  section?: Section
}

export function TeacherDashboard() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { webApp } = useTelegram()

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    setError(null)
    try {

      const authHeaders: HeadersInit = {}
      if (webApp?.initData) {
        authHeaders['x-telegram-init-data'] = webApp.initData
      }

      const response = await fetch(`/api/schedules`, {
        credentials: 'include', // Send session cookie
        headers: authHeaders,
      })
      const data = await response.json()
      if (response.ok) {
        setSchedules(data.schedules || [])
      } else {
        setError(data.error || 'Failed to load schedules')
        toast({
          title: 'Error',
          description: data.error || 'Failed to load schedules',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      const errMsg = error instanceof Error ? error.message : 'Failed to load schedules'
      setError(errMsg)
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Get upcoming class (next schedule in chronological order)
  const upcomingSchedule = schedules
    .filter((schedule) => new Date(schedule.schedule_date) >= new Date())
    .sort((a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime())[0]

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-primary">የመምህር ዳሽቦርድ</h1>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span>መርሃ ግብር በመጫን ላይ...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchSchedules} variant="outline">
                እንደገና ሞክር
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Next Assignment Card */}
          <Card className="bg-gradient-to-br from-primary/10 to-card">
            <CardHeader>
              <CardTitle>ቀጣይ መርሃ ግብር</CardTitle>
              <CardDescription>የሚቀጥለው ክፍለ ጊዜ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSchedule ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">
                        {upcomingSchedule.course.course_name || upcomingSchedule.course.course_description || 'መርሃ ግብር'}
                      </h3>
                      {upcomingSchedule.section?.section_name && (
                        <p className="text-xs text-primary font-medium mt-0.5">
                          ክፍል: {upcomingSchedule.section.section_name}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(upcomingSchedule.schedule_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">ምንም መርሃ ግብር የለም</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
