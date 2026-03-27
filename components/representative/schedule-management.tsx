'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Loader2, Calendar as CalendarIcon, Clock, Users, BookOpen, Edit, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { format, set } from 'date-fns'

interface Schedule {
  id: number
  date: string
  course: {
    id: number
    course_name: string
    verse: string | null
  } | null
  section: {
    id: number
    section_name: string | null
  } | null
  teacher: {
    id: number
    first_name: string
    last_name: string | null
    phone_number: string
    section_id: number | null
  }
}

interface Course {
  id: number
  course_name: string
  verse: string | null
}

interface Teacher {
  id: number
  first_name: string
  last_name: string | null
  phone_number: string
  section_id: number | null
}

export function ScheduleManagement() {
  const { toast } = useToast()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [formData, setFormData] = useState({
    course_id: '',
    teacher_id: '',
    time: ''
  })

  // New States for UX
  const [sections, setSections] = useState<{ id: string; section_name: string }[]>([])
  const [view, setView] = useState<'schedule' | 'create_course' | 'create_teacher'>('schedule')
  const [newCourse, setNewCourse] = useState({ description: "", objective: "" })
  const [newTeacher, setNewTeacher] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    tg_username: "",
    section_id: ""
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const userPhone = localStorage.getItem('userPhone')
      console.log('userPhone:', userPhone) // Debug
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const [schedulesRes, coursesRes, teachersRes, sectionsRes] = await Promise.all([
        fetch('/api/representative/schedules', {
          headers: { 'x-phone-number': userPhone }
        }),
        fetch('/api/courses', {
          headers: { 'x-phone-number': userPhone }
        }),
        fetch('/api/representative/teachers', {
          headers: { 'x-phone-number': userPhone }
        }),
        fetch('/api/representative/sections', {
          headers: { 'x-phone-number': userPhone }
        })
      ])

      const [schedulesData, coursesData, teachersData, sectionsData] = await Promise.all([
        schedulesRes.json(),
        coursesRes.json(),
        teachersRes.json(),
        sectionsRes.json()
      ])

      console.log('Schedules API response:', schedulesData) // Debug
      console.log('Courses API response:', coursesData) // Debug
      console.log('Teachers API response:', teachersData) // Debug

      if (schedulesRes.ok) setSchedules(schedulesData.schedules)
      else throw new Error(schedulesData.error || 'Failed to fetch schedules')
      if (coursesRes.ok) setCourses(coursesData.courses)
      else throw new Error(coursesData.error || 'Failed to fetch courses')
      if (teachersRes.ok) setTeachers(teachersData.teachers)
      else throw new Error(teachersData.error || 'Failed to fetch teachers')
      if (sectionsRes.ok) setSections(sectionsData.sections || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const userPhone = localStorage.getItem('userPhone')
    if (userPhone) {
      fetchData()
    }
  }, [])

  const handleCreateCourse = async () => {
    const userPhone = localStorage.getItem('userPhone') || ''
    const res = await fetch("/api/courses", {
      method: "POST",
      body: JSON.stringify({
        course_description: newCourse.description,
        objectives: [newCourse.objective]
      }),
      headers: {
        "Content-Type": "application/json",
        // Pass auth header just in case, though API might use session
        'x-phone-number': userPhone
      }
    });

    if (res.ok) {
      toast({ title: "Course created" });
      await fetchData(); // Reload all
      setView('schedule');
      setNewCourse({ description: "", objective: "" });
    } else {
      toast({ title: "Failed to create course", variant: "destructive" });
    }
  };

  const handleCreateTeacher = async () => {
    const userPhone = localStorage.getItem('userPhone') || ''
    const res = await fetch("/api/teachers", {
      method: "POST",
      body: JSON.stringify(newTeacher),
      headers: {
        "Content-Type": "application/json",
        'x-phone-number': userPhone
      }
    });

    if (res.ok) {
      toast({ title: "Teacher created" });
      await fetchData(); // Reload all
      setView('schedule');
      setNewTeacher({ first_name: "", last_name: "", phone_number: "", tg_username: "", section_id: "" });
    } else {
      const err = await res.json();
      toast({ title: err.error || "Failed to create teacher", variant: "destructive" });
    }
  };

  // ... (handleSubmit unchanged) ...

  // ... (handleDelete unchanged) ...

  const resetForm = () => {
    setFormData({
      course_id: '',
      teacher_id: '',
      time: ''
    })
    setSelectedDate(undefined)
    setEditingSchedule(null)
    setShowForm(false)
    setView('schedule')
  }

  const handleEdit = (schedule: Schedule) => {
    setEditingSchedule(schedule)
    const date = new Date(schedule.date)
    setSelectedDate(date)
    setFormData({
      course_id: schedule.course?.id.toString() || '',
      teacher_id: schedule.teacher.id.toString(),
      time: format(date, 'HH:mm')
    })
    setShowForm(true)
  }

  const formatScheduleDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy')
  }

  const formatScheduleTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm')
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Schedule Management
              </CardTitle>
              <CardDescription>Manage schedules for your assigned teachers</CardDescription>
            </div>
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="mr-2 h-4 w-4" />
              {showForm ? 'Cancel' : 'Add Schedule'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Schedule Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {view === 'schedule' ? (editingSchedule ? 'Edit Schedule' : 'Add New Schedule') :
                view === 'create_course' ? 'Create New Course' : 'Create New Teacher'}
            </CardTitle>
            <CardDescription>
              {view === 'schedule' ? (editingSchedule ? 'Update the schedule details' : 'Create a new schedule for your teachers') :
                'Fill in the details below'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {view === 'schedule' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal h-10"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          captionLayout="dropdown-buttons"
                          fromYear={2020}
                          toYear={2030}
                          className="rounded-md border"
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="teacher">Teacher *</Label>
                    {teachers.length === 0 ? (
                      <Button type="button" variant="outline" className="w-full" onClick={() => setView('create_teacher')}>+ Create Teacher</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Select value={formData.teacher_id} onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers.map(teacher => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.first_name} {teacher.last_name || ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setView('create_teacher')}>+</Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="course">Course</Label>
                    {courses.length === 0 ? (
                      <Button type="button" variant="outline" className="w-full" onClick={() => setView('create_course')}>+ Create Course</Button>
                    ) : (
                      <div className="flex gap-2">
                        <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select course (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {courses.map(course => (
                              <SelectItem key={course.id} value={course.id.toString()}>
                                {course.course_name || `Course ${course.id}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setView('create_course')}>+</Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={!selectedDate || !formData.teacher_id || !formData.time || formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {editingSchedule ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {editingSchedule ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                        {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                      </>
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {view === 'create_course' && (
              <div className="space-y-4">
                <div><Label>Description</Label><Input value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} /></div>
                <div><Label>Objective</Label><Input value={newCourse.objective} onChange={e => setNewCourse({ ...newCourse, objective: e.target.value })} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setView('schedule')}>Back</Button>
                  <Button onClick={handleCreateCourse}>Create Course</Button>
                </div>
              </div>
            )}

            {view === 'create_teacher' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>First Name</Label><Input value={newTeacher.first_name} onChange={e => setNewTeacher({ ...newTeacher, first_name: e.target.value })} /></div>
                  <div><Label>Last Name</Label><Input value={newTeacher.last_name} onChange={e => setNewTeacher({ ...newTeacher, last_name: e.target.value })} /></div>
                </div>
                <div><Label>Phone</Label><Input value={newTeacher.phone_number} onChange={e => setNewTeacher({ ...newTeacher, phone_number: e.target.value })} /></div>
                <div><Label>Telegram Username</Label><Input value={newTeacher.tg_username} onChange={e => setNewTeacher({ ...newTeacher, tg_username: e.target.value })} /></div>
                <div>
                  <Label>Section</Label>
                  <Select value={newTeacher.section_id} onValueChange={v => setNewTeacher({ ...newTeacher, section_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                    <SelectContent>
                      {sections.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.section_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setView('schedule')}>Back</Button>
                  <Button onClick={handleCreateTeacher}>Create Teacher</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedules List */}
      <Card>
        <CardHeader>
          <CardTitle>Current Schedules</CardTitle>
          <CardDescription>All schedules under your management</CardDescription>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No schedules found</p>
              <p className="text-sm">Create your first schedule to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map(schedule => (
                <Card key={schedule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-sky-600" />
                        <span className="font-medium">{formatScheduleDate(schedule.date)}</span>
                        <Badge variant="outline">{formatScheduleTime(schedule.date)}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {schedule.teacher.first_name} {schedule.teacher.last_name || ''}
                        </div>
                        {schedule.section && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {schedule.section.section_name || `Section ${schedule.section.id}`}
                          </div>
                        )}
                        {schedule.course && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {schedule.course.course_name || `Course ${schedule.course.id}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(schedule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this schedule? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(schedule.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
