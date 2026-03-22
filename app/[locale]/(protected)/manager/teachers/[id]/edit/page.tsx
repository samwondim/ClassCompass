'use client'

import { useEffect, useState } from 'react'
import { TelegramFormShell } from '@/components/telegram-form-shell'
import { UserEditForm } from '@/components/forms/user-edit-form'

export default function ManagerTeacherEditPage({ params }: { params: { locale: string; id: string } }) {
  const [user, setUser] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`/api/user/${params.id}`, {
          credentials: 'include'
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to load user')
        setUser(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user')
      }
    }
    loadUser()
  }, [params.id])

  const base = `/${params.locale}/manager`

  return (
    <TelegramFormShell title="መምህር መረጃ አስተካክል" description="የመምህሩን መረጃ ያዘምኑ">
      {error ? (
        <div className="px-4 py-4 text-sm text-red-600">{error}</div>
      ) : !user ? (
        <div className="px-4 py-4 text-sm text-slate-500">Loading...</div>
      ) : (
        <UserEditForm user={user} cancelHref={`${base}/teachers`} onSuccessHref={`${base}/teachers`} />
      )}
    </TelegramFormShell>
  )
}
