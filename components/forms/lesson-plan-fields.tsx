'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { LessonPlan } from '@/app/models/models'

const SECTIONS = [
  { key: 'opening', label: 'መግቢያ' },
  { key: 'teaching', label: 'ትምህርት' },
  { key: 'application', label: 'ተግባራዊ አተገባበር' },
  { key: 'activity', label: 'እንቅስቃሴ' },
  { key: 'memory_verse', label: 'የማስታወስ ጥቅስ' },
  { key: 'closing', label: 'መደምደሚያ' },
] as const

interface LessonPlanFieldsProps {
  value: LessonPlan
  onChange: (value: LessonPlan) => void
}

export function LessonPlanFields({ value, onChange }: LessonPlanFieldsProps) {
  return (
    <div className="mt-2 space-y-3">
      {SECTIONS.map((section) => (
        <div key={section.key}>
          <Label htmlFor={`lesson_plan_${section.key}`}>{section.label}</Label>
          <Textarea
            id={`lesson_plan_${section.key}`}
            value={value[section.key] || ''}
            onChange={(e) => onChange({ ...value, [section.key]: e.target.value })}
            className="mt-1"
          />
        </div>
      ))}
    </div>
  )
}
