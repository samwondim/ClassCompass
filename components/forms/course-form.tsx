'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FileText } from 'lucide-react'
import useToast from '@/hooks/use-toast'
import { LessonPlanFields } from './lesson-plan-fields'
import { LessonPlan } from '@/app/models/models'

interface CourseFormProps {
  cancelHref: string
  onSuccessHref: string
}

export function CourseForm({ cancelHref, onSuccessHref }: CourseFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<{ section_id: string; section_name: string }[]>([])
  const [units, setUnits] = useState<{ unit_id: string; title: string }[]>([])
  const [formData, setFormData] = useState({
    course_name: '',
    verse: '',
    course_description: '',
    section_id: '',
    unit_id: '',
    age_group: '',
    duration_minutes: '',
  })
  const [objectives, setObjectives] = useState<string[]>([''])
  const [lessonPlan, setLessonPlan] = useState<LessonPlan>({})
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections')
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

  useEffect(() => {
    const fetchUnits = async () => {
      if (!formData.section_id) {
        setUnits([])
        return
      }
      try {
        const res = await fetch(`/api/units?section_id=${formData.section_id}`)
        if (res.ok) {
          const data = await res.json()
          setUnits(data.units || [])
        }
      } catch (error) {
        console.error('Failed to fetch units:', error)
      }
    }
    fetchUnits()
  }, [formData.section_id])

  const handleImportDocx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast({ title: 'Error', description: 'Only .docx files are supported.', variant: 'destructive' })
      return
    }

    setImporting(true)
    try {
      const body = new FormData()
      body.append('file', file)

      const res = await fetch('/api/courses/extract-docx', {
        method: 'POST',
        credentials: 'include',
        body,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to read the document.')
      }

      const draft = data.draft
      setFormData((prev) => ({
        ...prev,
        course_name: draft.course_name || prev.course_name,
        verse: draft.verse || prev.verse,
        course_description: draft.course_description || prev.course_description,
        age_group: draft.age_group || prev.age_group,
        duration_minutes: draft.duration_minutes != null ? String(draft.duration_minutes) : prev.duration_minutes,
      }))
      if (draft.objectives?.length) setObjectives(draft.objectives)
      if (draft.lesson_plan) setLessonPlan(draft.lesson_plan)

      toast({ title: 'ተጨምሯል', description: 'ከሰነዱ የተገኘውን መረጃ ከማስቀመጥዎ በፊት ያረጋግጡ።' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import document.',
        variant: 'destructive',
      })
    } finally {
      setImporting(false)
    }
  }

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
          unit_id: formData.unit_id || null,
          age_group: formData.age_group || null,
          duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : null,
          lesson_plan: lessonPlan,
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              ከ Word ሰነድ (.docx) አስመጣ
            </CardTitle>
            <CardDescription>
              ትምህርቱን የያዘ .docx ሰነድ ይስቀሉ፤ መረጃውን በራስ-ሰር ወደ ታችኛው ቅጽ ያስገባል። ከማስቀመጥዎ በፊት መረጃውን ማረጋገጥ ያስፈልጋል።
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Label htmlFor="docx_import" className="cursor-pointer">
              <span className="text-primary hover:underline">{importing ? 'በማንበብ ላይ...' : 'ፋይል ይምረጡ'}</span>
              <input
                id="docx_import"
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
                onChange={handleImportDocx}
                disabled={importing}
              />
            </Label>
          </CardContent>
        </Card>
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="course_name">የትምህርት ዓርዕስ</Label>
        <Input id="course_name" name="course_name" value={formData.course_name} onChange={(e) => setFormData({ ...formData, course_name: e.target.value })} required />
      </div>
      <div className="px-4 py-3">
        <Label>ክፍል ይምረጡ</Label>
        <Select value={formData.section_id} onValueChange={(v) => setFormData({ ...formData, section_id: v, unit_id: '' })}>
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
        <Label>የትምህርት ክፍለ-ጊዜ (Unit)</Label>
        <Select value={formData.unit_id} onValueChange={(v) => setFormData({ ...formData, unit_id: v })}>
          <SelectTrigger className="mt-2">
            <SelectValue placeholder={units.length ? 'Unit ምረጥ' : 'ክፍል ይምረጡ'} />
          </SelectTrigger>
          <SelectContent>
            {units.map((unit) => (
              <SelectItem key={unit.unit_id} value={unit.unit_id}>
                {unit.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="verse">ጥቅሥ</Label>
        <Input id="verse" name="verse" value={formData.verse} onChange={(e) => setFormData({ ...formData, verse: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <div>
          <Label htmlFor="age_group">የእድሜ ክልል</Label>
          <Input id="age_group" name="age_group" value={formData.age_group} onChange={(e) => setFormData({ ...formData, age_group: e.target.value })} placeholder="ለምሳሌ 6-8" className="mt-1" />
        </div>
        <div>
          <Label htmlFor="duration_minutes">የቆይታ (ደቂቃ)</Label>
          <Input id="duration_minutes" name="duration_minutes" type="number" value={formData.duration_minutes} onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })} placeholder="45" className="mt-1" />
        </div>
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
      <div className="px-4 py-3">
        <Label>የትምህርቱ እቅድ</Label>
        <LessonPlanFields value={lessonPlan} onChange={setLessonPlan} />
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
