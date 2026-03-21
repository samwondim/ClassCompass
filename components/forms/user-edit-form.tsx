'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useToast from '@/hooks/use-toast'

interface UserEditFormProps {
  user: { user_id: string; first_name: string; last_name: string; phone_number: string; tg_username: string }
  cancelHref: string
  onSuccessHref: string
}

export function UserEditForm({ user, cancelHref, onSuccessHref }: UserEditFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [firstName, setFirstName] = useState(user.first_name)
  const [lastName, setLastName] = useState(user.last_name)
  const [phoneNumber, setPhoneNumber] = useState(user.phone_number)
  const [tgUsername, setTgUsername] = useState(user.tg_username)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/user/${user.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          tg_username: tgUsername,
        }),
      })

      if (!res.ok) throw new Error('Failed to update user')

      toast({ title: 'Success', description: 'User updated' })
      router.push(onSuccessHref)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update user',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 py-3">
        <Label htmlFor="first_name">First Name</Label>
        <Input id="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="last_name">Last Name</Label>
        <Input id="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input id="phone_number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="tg_username">Telegram Username</Label>
        <Input id="tg_username" value={tgUsername} onChange={(e) => setTgUsername(e.target.value)} />
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
