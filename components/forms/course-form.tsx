'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import useToast from '@/hooks/use-toast'

interface CourseFormProps {
  cancelHref: string
  onSuccessHref: string
}

export function CourseForm({ cancelHref, onSuccessHref }: CourseFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<{ section_id: string; section_name: string }[]>([])
  const [formData, setFormData] = useState({
    course_name: '',
    verse: '',
    course_description: '',
    section_id: '',
  })
  const [objectives, setObjectives] = useState<string[]>([''])

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/managers/sections')
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

  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives]
    newObjectives[index] = value
    setObjectives(newObjectives)
  }

  const addObjective = () => setObjectives([...objectives, ''])
  const removeObjective = (index: number) => {
    const newObjectives = [...objectives]
    newObjectives.splice(index, 1)
    setObjectives(newObjectives)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.course_name.trim()) {
      toast({ title: 'Error', description: 'Course Name is required.', variant: 'destructive' })
      return
    }

    if (!formData.section_id) {
      toast({ title: 'Error', description: 'Section is required.', variant: 'destructive' })
      return
    }

    const validObjectives = objectives.map((obj) => obj.trim()).filter((obj) => obj.length > 0)

    setLoading(true)
    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          course_name: formData.course_name,
          verse: formData.verse,
          course_description: formData.course_description,
          objectives: validObjectives,
          section_id: formData.section_id,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to add course.')
      }

      toast({ title: 'Success', description: 'ይትምህርቱ መረጃ ተመዝግቧል' })
      router.push(onSuccessHref)
      router.refresh()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add course.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 py-3">
        <Label htmlFor="course_name">የትምህርት ዓርዕስ</Label>
        <Input id="course_name" name="course_name" value={formData.course_name} onChange={(e) => setFormData({ ...formData, course_name: e.target.value })} required />
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
      <div className="px-4 py-3">
        <Label htmlFor="verse">ጥቅሥ</Label>
        <Input id="verse" name="verse" value={formData.verse} onChange={(e) => setFormData({ ...formData, verse: e.target.value })} />
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="course_description">ስለ ትምህርቱ አጭር ማብራርያ</Label>
        <Textarea id="course_description" name="course_description" value={formData.course_description} onChange={(e) => setFormData({ ...formData, course_description: e.target.value })} />
      </div>
      <div className="px-4 py-3">
        <Label>የትምህርቱ አላማዎች</Label>
        <div className="mt-2 space-y-2">
          {objectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <Input value={objective} onChange={(e) => handleObjectiveChange(index, e.target.value)} placeholder={`Objective ${index + 1}`} />
              {objectives.length > 1 && (
                <Button type="button" variant="ghost" onClick={() => removeObjective(index)}>
                  አጥፋ
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addObjective}>
            አዲስ አላማ ጨምር
          </Button>
        </div>
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
