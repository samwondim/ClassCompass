'use client'

import { useEffect, useState } from 'react'
import { TelegramFormShell } from '@/components/telegram-form-shell'
import { ScheduleEditForm } from '@/components/forms/schedule-edit-form'

export default function ManagerScheduleEditPage({ params }: { params: { locale: string; id: string } }) {
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
    loadSchedule()
  }, [params.id])

  const base = `/${params.locale}/manager`

  return (
    <TelegramFormShell title="መርሃግብር አስተካክል" description="የትምህርት መርሃግብር ያዘምኑ">
      {error ? (
        <div className="px-4 py-4 text-sm text-red-600">{error}</div>
      ) : !schedule ? (
        <div className="px-4 py-4 text-sm text-slate-500">Loading...</div>
      ) : (
        <ScheduleEditForm schedule={schedule} cancelHref={`${base}/schedules`} onSuccessHref={`${base}/schedules`} />
      )}
    </TelegramFormShell>
  )
}
