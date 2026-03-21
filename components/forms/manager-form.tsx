'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useToast from '@/hooks/use-toast'

interface ManagerFormProps {
  cancelHref: string
  onSuccessHref: string
}

export function ManagerForm({ cancelHref, onSuccessHref }: ManagerFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<Array<{ section_id: string; section_name: string }>>([])
  const [selectedSections, setSelectedSections] = useState<string[]>([])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    tg_username: '',
    phone_number: '',
  })

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections')
        const data = await res.json()
        setSections(data.sections || [])
      } catch (error) {
        console.error(error)
        setSections([])
      }
    }
    fetchSections()
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
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          user_role: 'MANAGER',
          sectionIds: selectedSections,
        }),
      })

      if (!res.ok) throw new Error(`Failed: ${res.status}`)

      toast({ title: 'Success', description: 'Manager added!' })
      router.push(onSuccessHref)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add manager',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 py-3">
        <Label htmlFor="first_name">ስም</Label>
        <Input id="first_name" name="first_name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required />
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="last_name">የአባት ስም</Label>
        <Input id="last_name" name="last_name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required />
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="tg_username">ተሌግራም ዩዘርኔም</Label>
        <Input id="tg_username" name="tg_username" value={formData.tg_username} onChange={(e) => setFormData({ ...formData, tg_username: e.target.value })} required />
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="phone_number">የስልክ ቁጥር</Label>
        <Input id="phone_number" name="phone_number" value={formData.phone_number} onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })} required />
      </div>
      <div className="px-4 py-3">
        <Label>ሚያስተዳድረው ክፍል</Label>
        <Select>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="ክፍል ይምረጡ" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((sec) => (
              <SelectItem key={sec.section_id} value={sec.section_id} onClick={() => toggleSection(sec.section_id)}>
                <span className={selectedSections.includes(sec.section_id) ? 'font-semibold' : ''}>
                  {sec.section_name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 text-sm text-slate-500">Selected: {selectedSections.length > 0 ? selectedSections.length : 'None'}</div>
      </div>
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <Button type="button" variant="ghost" onClick={() => router.push(cancelHref)}>
          ተመለስ
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'በመመዝገብ ላይ...' : 'መዝግብ'}
        </Button>
      </div>
    </form>
  )
}
