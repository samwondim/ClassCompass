'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TelegramFormShell } from '@/components/telegram-form-shell'
import { CourseEditForm } from '@/components/forms/course-edit-form'
import { Course } from '@/app/models/models'

export default function ManagerCourseEditPage() {
  const params = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${params.id}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load course')
        setCourse(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course')
      }
    }
    if (params.id) loadCourse()
  }, [params.id])

  const base = `/${params.locale}/manager`

  return (
    <TelegramFormShell title="ትምህርት አስተካክል" description="የትምህርቱን መረጃ ያዘምኑ">
      {error ? (
        <div className="px-4 py-4 text-sm text-destructive">{error}</div>
      ) : !course ? (
        <div className="px-4 py-4 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <CourseEditForm course={course} cancelHref={`${base}/courses`} onSuccessHref={`${base}/courses`} />
      )}
    </TelegramFormShell>
  )
}
