'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useToast from '@/hooks/use-toast'

interface TeacherFormProps {
  role?: 'ADMIN' | 'MANAGER'
  cancelHref: string
  onSuccessHref: string
}

export function TeacherForm({ role = 'MANAGER', cancelHref, onSuccessHref }: TeacherFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingSections, setLoadingSections] = useState(true)
  const [sections, setSections] = useState<{ section_id: string; section_name: string }[]>([])
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    tg_username: '',
    phone_number: '',
    section_id: '',
  })

  useEffect(() => {
    async function fetchSections() {
      setLoadingSections(true)
      try {
        const endpoint = role === 'ADMIN' ? '/api/sections' : '/api/managers/sections'
        const res = await fetch(endpoint)
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed to fetch sections')
        const normalized = (data.sections || []).map((s: any) => ({
          section_id: s.section_id,
          section_name: s.section_name,
        }))
        setSections(normalized)
        if (normalized.length === 1) {
          setFormData(prev => ({ ...prev, section_id: normalized[0].section_id }))
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load sections',
          variant: 'destructive',
        })
      } finally {
        setLoadingSections(false)
      }
    }

    fetchSections()
  }, [role, toast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.section_id) {
      toast({ title: 'Error', description: 'Please select a section', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/teachers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_role: 'TEACHER' }),
      })
      const responseData = await res.json()
      if (!res.ok) throw new Error(responseData.error || 'Failed to add teacher')

      toast({ title: 'Success', description: 'Teacher added successfully.' })
      router.push(onSuccessHref)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add teacher.',
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
        <Label>ክፍል መመድብያ</Label>
        {loadingSections ? (
          <div className="mt-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
            ክፍሎች በመፈለግ ላይ...
          </div>
        ) : sections.length === 0 ? (
          <div className="mt-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {role === 'ADMIN'
              ? 'አሁን የተመደበ ክፍል የለም። እባኮ በመጀመሪያ ክፍል ይፍጠሩ።'
              : 'ክፍል አልተመደበሎትም እባኮ አድሚኑን ያናግሩ'}
          </div>
        ) : sections.length === 1 ? (
          <Input value={sections[0].section_name} disabled className="mt-2 bg-muted" />
        ) : (
          <Select onValueChange={(value) => setFormData({ ...formData, section_id: value })} value={formData.section_id}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="ክፍል ይምረጡ" />
            </SelectTrigger>
            <SelectContent>
              {sections.map((s) => (
                <SelectItem key={s.section_id} value={s.section_id}>
                  {s.section_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
