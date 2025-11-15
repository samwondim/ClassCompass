'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, BookOpen, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AppLayout } from '@/components/app-layout'
import { TeacherSchedule } from '@/components/teacher/teacher-schedule'
import { LessonDetails } from '@/components/teacher/lesson-details'

interface Schedule {
  id: number
  date: string
  course?: {
    id: number
    course_name: string
    verse?: string
  }
  section?: {
    id: number
    section_name: string
  }
  teacher: {
    id: number
    name: string
  }
}

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/schedules')

      const data = await response.json()

      if (response.ok) {
        setSchedules(data.schedules)
      } else {
        setError(data.error || 'Failed to load schedules')
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      setError('Failed to load schedules')
    } finally {
      setLoading(false)
    }
  }

  // Get upcoming class (next class in chronological order)
  const upcomingClass = schedules
    .filter((schedule) => new Date(schedule.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]

  return (
    <AppLayout userRole="teacher">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-sky-700 mb-4">Teacher Dashboard</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 h-auto">
            <TabsTrigger value="dashboard" className="py-2">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="schedule" className="py-2">
              My Schedule
            </TabsTrigger>
            <TabsTrigger value="lessons" className="py-2">
              Lessons
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    <span className="ml-2">Loading your schedule...</span>
                  </div>
                </CardContent>
              </Card>
            ) : error ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-red-600 mb-4">{error}</p>
                    <Button onClick={fetchSchedules}>Try Again</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-gradient-to-br from-sky-50 to-white">
                  <CardHeader>
                    <CardTitle>Next Teaching Assignment</CardTitle>
                    <CardDescription>Your upcoming class</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {upcomingClass ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                            <Calendar className="h-6 w-6 text-sky-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-medium">
                              {upcomingClass.course?.course_name || 'Teaching Assignment'}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {new Date(upcomingClass.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="text-sm">
                              {new Date(upcomingClass.date).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                          {upcomingClass.course?.verse && (
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-slate-500" />
                              <span className="text-sm">{upcomingClass.course.verse}</span>
                            </div>
                          )}
                        </div>

                        {upcomingClass.section && (
                          <div className="text-sm text-muted-foreground">
                            Section: {upcomingClass.section.section_name}
                          </div>
                        )}

                        <div className="flex justify-between">
                          <Button variant="outline" onClick={() => setActiveTab('lessons')}>
                            View Lesson Details
                          </Button>
                          <Button>Mark as Prepared</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No upcoming classes scheduled</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick View</CardTitle>
                      <CardDescription>Your teaching schedule</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {schedules.length > 0 ? (
                          <>
                            {schedules
                              .filter((schedule) => new Date(schedule.date) >= new Date())
                              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .slice(0, 3)
                              .map((schedule, index) => (
                                <div key={schedule.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                                    <Calendar className="h-5 w-5 text-sky-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium">
                                      {schedule.course?.course_name || 'Teaching Assignment'}
                                    </p>
                                    <div className="flex items-center text-xs text-muted-foreground">
                                      <span>
                                        {new Date(schedule.date).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric'
                                        })} • {new Date(schedule.date).toLocaleTimeString('en-US', {
                                          hour: 'numeric',
                                          minute: '2-digit',
                                          hour12: true
                                        })}
                                      </span>
                                    </div>
                                    {schedule.section && (
                                      <div className="text-xs text-muted-foreground">
                                        {schedule.section.section_name}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            <Button variant="outline" className="w-full" onClick={() => setActiveTab('schedule')}>
                              View Full Schedule
                            </Button>
                          </>
                        ) : (
                          <div className="text-center text-muted-foreground py-8">
                            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No schedules found</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Resources</CardTitle>
                      <CardDescription>Teaching materials and guides</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { title: 'Lesson Plan Template', type: 'PDF' },
                          { title: 'Classroom Management Guide', type: 'PDF' },
                          { title: 'Activity Ideas', type: 'PDF' },
                          { title: 'Parent Communication Tips', type: 'PDF' },
                        ].map((resource, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-red-100 text-xs font-medium text-red-700">
                                {resource.type}
                              </div>
                              <span className="text-sm font-medium">{resource.title}</span>
                            </div>
                            <Button variant="ghost" size="sm">
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="schedule">
            <TeacherSchedule />
          </TabsContent>

          <TabsContent value="lessons">
            <LessonDetails />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
