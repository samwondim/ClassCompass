'use client'

import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useToast from '@/hooks/use-toast'

const ROLES = ['TEACHER', 'MANAGER', 'ADMIN'] as const

interface RoleSelectProps {
  userId: string
  currentRole: string
}

export function RoleSelect({ userId, currentRole }: RoleSelectProps) {
  const { toast } = useToast()
  const [value, setValue] = useState(currentRole)
  const [loading, setLoading] = useState(false)

  const handleChange = async (newRole: string) => {
    if (newRole === value) return
    setLoading(true)
    try {
      const res = await fetch(`/api/user/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_role: newRole }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to update role')
      }

      toast({ title: 'Success', description: 'ሚናው ተቀይሯል' })
      window.location.reload()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update role',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Select value={value} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="h-8 w-[130px]" aria-label="Change role">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((role) => (
          <SelectItem key={role} value={role}>
            {role.charAt(0) + role.slice(1).toLowerCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
