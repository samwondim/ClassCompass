'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TelegramFormShell } from '@/components/telegram-form-shell'
import { UserEditForm } from '@/components/forms/user-edit-form'

export default function AdminManagerEditPage() {
  const params = useParams()
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
    if (params.id) loadUser()
  }, [params.id])

  const base = `/${params.locale}/admin`

  return (
    <TelegramFormShell title="አስተዳዳሪ መረጃ አስተካክል" description="የአስተዳዳሪውን መረጃ ያዘምኑ">
      {error ? (
        <div className="px-4 py-4 text-sm text-destructive">{error}</div>
      ) : !user ? (
        <div className="px-4 py-4 text-sm text-muted-foreground">Loading...</div>
      ) : (
        <UserEditForm user={user} cancelHref={`${base}/managers`} onSuccessHref={`${base}/managers`} />
      )}
    </TelegramFormShell>
  )
}
