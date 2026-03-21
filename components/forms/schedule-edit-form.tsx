'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useToast from '@/hooks/use-toast'

interface ScheduleEditFormProps {
  schedule: {
    schedule_id: string
    schedule_date: string | Date
    course: { course_id: string; course_name?: string | null; course_description?: string | null }
    teacher: { user_id: string; first_name: string; last_name: string }
  }
  cancelHref: string
  onSuccessHref: string
}

export function ScheduleEditForm({ schedule, cancelHref, onSuccessHref }: ScheduleEditFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([])
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([])

  const scheduleDate = new Date(schedule.schedule_date)
  const initialDate = new Date(scheduleDate.getTime() - scheduleDate.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  const [formData, setFormData] = useState({
    schedule_date: initialDate,
    course_id: schedule.course.course_id,
    teacher_id: schedule.teacher.user_id,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesRes, teachersRes] = await Promise.all([
          fetch('/api/courses'),
          fetch('/api/user/get-teachers'),
        ])
        const coursesData = await coursesRes.json()
        const teachersData = await teachersRes.json()
        setCourses(
          (coursesData.courses || []).map((c: any) => ({
            id: c.course_id,
            name: c.course_name || c.course_description,
          }))
        )
        setTeachers(
          (teachersData.teachers || []).map((t: any) => ({
            id: t.user_id,
            name: `${t.first_name} ${t.last_name}`,
          }))
        )
      } catch (error) {
        console.error(error)
      }
    }
    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/schedules/${schedule.schedule_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          schedule_date: new Date(formData.schedule_date).toISOString(),
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update schedule')

      toast({ title: 'Success', description: 'Schedule updated' })
      router.push(onSuccessHref)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update schedule',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 py-3">
        <Label htmlFor="schedule_date">ቀን</Label>
        <Input
          id="schedule_date"
          type="datetime-local"
          value={formData.schedule_date}
          onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
          required
        />
      </div>
      <div className="px-4 py-3">
        <Label>ትምህርት</Label>
        <Select value={formData.course_id} onValueChange={(v) => setFormData({ ...formData, course_id: v })}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="px-4 py-3">
        <Label>መምህር</Label>
        <Select value={formData.teacher_id} onValueChange={(v) => setFormData({ ...formData, teacher_id: v })}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select a teacher" />
          </SelectTrigger>
          <SelectContent>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id}>
                {teacher.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <Button type="button" variant="ghost" onClick={() => router.push(cancelHref)}>
          ተመለስ
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'በመመዝገብ ላይ...' : 'አስተካክል'}
        </Button>
      </div>
    </form>
  )
}
