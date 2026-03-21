'use client'

import { useEffect, useState } from 'react'
import { TelegramFormShell } from '@/components/telegram-form-shell'
import { CourseEditForm } from '@/components/forms/course-edit-form'
import { Course } from '@/app/models/models'

export default function ManagerCourseEditPage({ params }: { params: { locale: string; id: string } }) {
  const [course, setCourse] = useState<Course | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const res = await fetch(`/api/courses/${params.id}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load course')
        setCourse(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course')
      }
    }
    loadCourse()
  }, [params.id])

  const base = `/${params.locale}/manager`

  return (
    <TelegramFormShell title="ትምህርት አስተካክል" description="የትምህርቱን መረጃ ያዘምኑ">
      {error ? (
        <div className="px-4 py-4 text-sm text-red-600">{error}</div>
      ) : !course ? (
        <div className="px-4 py-4 text-sm text-slate-500">Loading...</div>
      ) : (
        <CourseEditForm course={course} cancelHref={`${base}/courses`} onSuccessHref={`${base}/courses`} />
      )}
    </TelegramFormShell>
  )
}
