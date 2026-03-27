'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TelegramFormShell } from '@/components/telegram-form-shell'
import { ScheduleEditForm } from '@/components/forms/schedule-edit-form'

export default function AdminScheduleEditPage() {
  const params = useParams()
  const [schedule, setSchedule] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const res = await fetch(`/api/schedules/${params.id}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load schedule')
        setSchedule(data.schedule || data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load schedule')
      }
    }
    if (params.id) loadSchedule()
  }, [params.id])

  const base = `/${params.locale}/admin`

  return (
    <TelegramFormShell title="መርሃግብር አስተካክል" description="የትምህርት መርሃግብር ያዘምኑ">
      {error ? (
        <div className="px-4 py-4 text-sm text-destructive">{error}</div>
      ) : !schedule ? (
        <div className="px-4 py-4 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <ScheduleEditForm schedule={schedule} cancelHref={`${base}/schedules`} onSuccessHref={`${base}/schedules`} />
      )}
    </TelegramFormShell>
  )
}
