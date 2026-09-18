'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Layers, Plus, Trash2 } from 'lucide-react'
import useToast from '@/hooks/use-toast'

interface UnitCourse {
  course_id: string
  course_name: string | null
  verse: string | null
  course_description: string
  order: number | null
}

interface Unit {
  unit_id: string
  title: string
  description: string | null
  order: number
  period: string | null
  section_id: string
  section: { section_id: string; section_name: string }
  courses: UnitCourse[]
}

interface Section {
  section_id: string
  section_name: string
}

interface UnitsListProps {
  role: 'admin' | 'manager'
  locale: string
}

export function UnitsList({ role, locale }: UnitsListProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [units, setUnits] = useState<Unit[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [selectedSectionId, setSelectedSectionId] = useState('all')
  const [loading, setLoading] = useState(true)

  const base = `/${locale}/${role}`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [unitsRes, sectionsRes] = await Promise.all([
        fetch('/api/units', { credentials: 'include' }),
        fetch('/api/sections', { credentials: 'include' }),
      ])
      if (unitsRes.ok) {
        const data = await unitsRes.json()
        setUnits(data.units || [])
      }
      if (sectionsRes.ok) {
        const data = await sectionsRes.json()
        setSections(data.sections || [])
      }
    } catch (error) {
      console.error('Failed to load units:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (unitId: string) => {
    if (!confirm('ይህን ክፍለ-ጊዜ መሰረዝ ይፈልጋሉ?')) return
    try {
      const res = await fetch(`/api/units/${unitId}`, { method: 'DELETE', credentials: 'include' })
      if (res.ok) {
        toast({ title: 'Success', description: 'ክፍለ-ጊዜው ተሰርዟል' })
        load()
      } else {
        const err = await res.json().catch(() => ({}))
        toast({ title: 'Error', description: err.error || 'መሰረዝ አልተሳካም', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'መሰረዝ አልተሳካም', variant: 'destructive' })
    }
  }

  const visibleUnits = selectedSectionId === 'all'
    ? units
    : units.filter((u) => u.section_id === selectedSectionId)

  const grouped = visibleUnits.reduce<Record<string, Unit[]>>((acc, unit) => {
    const key = unit.section?.section_id || 'none'
    ;(acc[key] ||= []).push(unit)
    return acc
  }, {})

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">ክፍለ-ጊዜዎች</h1>
        <Link href={`${base}/units/new`}>
          <span className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            <Plus className="h-4 w-4" />
            አዲስ ክፍለ-ጊዜ
          </span>
        </Link>
      </div>

      <div className="mb-6 max-w-xs">
        <Select value={selectedSectionId} onValueChange={setSelectedSectionId}>
          <SelectTrigger>
            <SelectValue placeholder="ክፍል ምረጥ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ሁሉም ክፍሎች</SelectItem>
            {sections.map((section) => (
              <SelectItem key={section.section_id} value={section.section_id}>
                {section.section_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">በመጫን ላይ...</p>
      ) : visibleUnits.length === 0 ? (
        <p className="text-muted-foreground">ምንም ክፍለ-ጊዜ አልተገኘም</p>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([sectionId, sectionUnits]) => {
            const section = sections.find((s) => s.section_id === sectionId)
            return (
              <div key={sectionId}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-muted-foreground">
                  <Layers className="h-4 w-4" />
                  {section?.section_name || 'ክፍል'}
                </h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[...sectionUnits]
                    .sort((a, b) => a.order - b.order)
                    .map((unit) => (
                      <Card key={unit.unit_id}>
                        <CardHeader className="flex flex-row items-start justify-between gap-2">
                          <div>
                            <CardTitle className="text-base">{unit.title}</CardTitle>
                            {unit.period && (
                              <p className="mt-1 text-xs text-muted-foreground">{unit.period}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            aria-label="Delete unit"
                            onClick={() => handleDelete(unit.unit_id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardHeader>
                        <CardContent>
                          {unit.description && (
                            <p className="text-sm text-muted-foreground">{unit.description}</p>
                          )}
                          <div className="mt-3 space-y-1">
                            {unit.courses.length === 0 ? (
                              <p className="text-xs text-muted-foreground">ምንም ትምህርት የለም</p>
                            ) : (
                              [...unit.courses]
                                .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                .map((course) => (
                                  <div key={course.course_id} className="flex items-center gap-2">
                                    <Badge variant="outline" className="flex-1 truncate justify-start">
                                      {course.course_name || course.course_description || 'ስም የሌለው'}
                                    </Badge>
                                    {course.verse && (
                                      <span className="text-xs italic text-muted-foreground">{course.verse}</span>
                                    )}
                                  </div>
                                ))
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
