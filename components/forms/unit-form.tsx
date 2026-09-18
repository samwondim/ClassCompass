'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useToast from '@/hooks/use-toast'

interface UnitFormProps {
  cancelHref: string
  onSuccessHref: string
}

export function UnitForm({ cancelHref, onSuccessHref }: UnitFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<{ section_id: string; section_name: string }[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: '',
    period: '',
    section_id: '',
  })

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setSections(data.sections || [])
        }
      } catch (error) {
        console.error('Failed to fetch sections:', error)
      }
    }
    fetchSections()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'ርዕስ ያስፈልጋል', variant: 'destructive' })
      return
    }
    if (!formData.section_id) {
      toast({ title: 'Error', description: 'ክፍል ያስፈልጋል', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          order: formData.order ? Number(formData.order) : 0,
          period: formData.period,
          section_id: formData.section_id,
        }),
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create unit.')
      }

      toast({ title: 'Success', description: 'ክፍለ-ጊዜው ተመዝግቧል' })
      router.push(onSuccessHref)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create unit.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 py-3">
        <Label htmlFor="title">ርዕስ</Label>
        <Input id="title" name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
      </div>
      <div className="px-4 py-3">
        <Label>ክፍል ይምረጡ</Label>
        <Select value={formData.section_id} onValueChange={(v) => setFormData({ ...formData, section_id: v })}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="ክፍል ምረጥ" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((section) => (
              <SelectItem key={section.section_id} value={section.section_id}>
                {section.section_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <div>
          <Label htmlFor="order">ቅደም ተከተል</Label>
          <Input id="order" name="order" type="number" value={formData.order} onChange={(e) => setFormData({ ...formData, order: e.target.value })} placeholder="1" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="period">ወቅት</Label>
          <Input id="period" name="period" value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} placeholder="ለምሳሌ Q1 2026" className="mt-1" />
        </div>
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="description">መግለጫ</Label>
        <Textarea id="description" name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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
