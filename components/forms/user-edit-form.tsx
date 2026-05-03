'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useToast from '@/hooks/use-toast'

interface SectionRelation {
  section: { section_id: string; section_name: string }
}

interface UserEditFormProps {
  user: {
    user_id: string
    first_name: string
    last_name: string
    phone_number: string
    tg_username: string
    teacher_sections?: SectionRelation[]
    ManagerSection?: SectionRelation[]
  }
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
  const [sections, setSections] = useState<Array<{ section_id: string; section_name: string }>>([])
  
  const initialSections = [
    ...(user.teacher_sections?.map((ts) => ts.section.section_id) || []),
    ...(user.ManagerSection?.map((ms) => ms.section.section_id) || []),
  ]

  const [selectedSections, setSelectedSections] = useState<string[]>(initialSections)

  useEffect(() => {
    const loadSections = async () => {
      try {
        const res = await fetch('/api/sections')
        const data = await res.json()
        setSections(data.sections || [])
      } catch (error) {
        console.error('Failed to load sections:', error)
      }
    }
    loadSections()
  }, [])

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

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
          sectionIds: selectedSections,
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
      <div className="px-4 py-3">
        <Label>ክፍሎች (Sections)</Label>
        <Select onValueChange={(value) => toggleSection(value)}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="ክፍል ይምረጡ" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((sec) => (
              <SelectItem key={sec.section_id} value={sec.section_id}>
                <span className={selectedSections.includes(sec.section_id) ? 'font-semibold' : ''}>
                  {sec.section_name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 text-sm text-muted-foreground">
          Selected: {selectedSections.length > 0 ? selectedSections.length : 'None'}
        </div>
      </div>
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <Button type="button" variant="ghost" onClick={() => router.push(cancelHref)}>
          ተመለስ
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'በመመዝገብ ላዋ...' : 'አስተካክል'}
        </Button>
      </div>
    </form>
  )
}
