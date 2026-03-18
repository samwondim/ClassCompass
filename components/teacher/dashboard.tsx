'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, BookOpen, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useToast from '@/hooks/use-toast'

// Types based on Prisma schema
interface Objective {
  id: string
  objective: string
}

interface Course {
  course_id: string
  course_description: string
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
  const [activeTab, setActiveTab] = useState('dashboard')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    setError(null)
    try {

      const response = await fetch(`/api/schedules`, {
        credentials: 'include' // Send session cookie
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

  // Get sections for the teacher (from teacher_sections)
  const teacherSections = Array.from(
    new Set(
      schedules
        .map((schedule) => schedule.section?.section_name)
        .filter((name): name is string => Boolean(name))
    )
  )

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold text-sky-700">Teacher Dashboard</h1>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span>Loading your schedule...</span>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchSchedules} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Next Assignment Card */}
          <Card className="bg-gradient-to-br from-sky-50 to-white">
            <CardHeader>
              <CardTitle>Next Teaching Assignment</CardTitle>
              <CardDescription>Your upcoming class</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingSchedule ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                      <Calendar className="h-6 w-6 text-sky-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">
                        {upcomingSchedule.course.course_description || 'Teaching Assignment'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(upcomingSchedule.schedule_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>
                        {new Date(upcomingSchedule.schedule_date).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                    </div>
                  </div>
                  {teacherSections.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      Sections: {teacherSections.join(', ')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p className="text-muted-foreground">No upcoming classes scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick View Card */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Schedule View</CardTitle>
              <CardDescription>Your upcoming teaching sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedules.length > 0 ? (
                  <>
                    {schedules
                      .filter((schedule) => new Date(schedule.schedule_date) >= new Date())
                      .sort((a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime())
                      .slice(0, 3)
                      .map((schedule) => (
                        <div key={schedule.schedule_id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                            <Calendar className="h-5 w-5 text-sky-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">
                              {schedule.course.course_description}
                            </p>
                            <div className="flex items-center text-xs text-muted-foreground space-x-1">
                              <span>
                                {new Date(schedule.schedule_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(schedule.schedule_date).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p className="text-muted-foreground">No schedules found</p>
                    <Button variant="outline" onClick={fetchSchedules} className="mt-4">
                      Refresh
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Full Views */}
        </>
      )}
    </div>
  )
}

// Stub components (implement based on needs)
function TeacherSchedule({ schedules, onRefresh }: { schedules: Schedule[]; onRefresh: () => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Full Teaching Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <p className="text-muted-foreground">No schedules available.</p>
        ) : (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div key={schedule.schedule_id} className="p-3 border rounded-lg">
                <h4 className="font-medium">{schedule.course.course_description}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(schedule.schedule_date).toLocaleString()}
                </p>
                <p className="text-xs">Section: {schedule.section?.section_name || 'N/A'}</p>
              </div>
            ))}
          </div>
        )}
        <Button onClick={onRefresh} variant="outline" className="mt-4">
          Refresh Schedule
        </Button>
      </CardContent>
    </Card>
  )
}

function LessonDetails({ schedules }: { schedules: Schedule[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lesson Objectives</CardTitle>
      </CardHeader>
      <CardContent>
        {schedules.length === 0 ? (
          <p className="text-muted-foreground">No lessons available.</p>
        ) : (
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div key={schedule.schedule_id}>
                <h4 className="font-medium mb-2">{schedule.course.course_description}</h4>
                <ul className="space-y-1 text-sm">
                  {schedule.course.objectives.map((obj) => (
                    <li key={obj.id} className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 mt-0.5 text-sky-600 flex-shrink-0" />
                      <span>{obj.objective}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
