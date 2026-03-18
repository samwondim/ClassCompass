
'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddTeacherForm } from "@/components/manager/add-teacher-form"
import { AddCourseForm } from "@/components/manager/add-course-form"
import { AddSectionForm } from "@/components/manager/add-section-form"

export function AdminDashboard() {
  const [activeForm, setActiveForm] = useState<null | 'teacher' | 'course' | 'section'>(null)

  const handleToggleForm = (formType: 'teacher' | 'course' | 'section') => {
    setActiveForm(activeForm === formType ? null : formType)
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-sky-700 mb-4">እንኳን ደህና መጡ</h1>


      <Card>
        <CardHeader>
          <CardTitle>ፈጣን ማስተካከያ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row justify-center">
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-3 gap-3">
              <Button variant="secondary" onClick={() => handleToggleForm('teacher')}>
                {activeForm === 'teacher' ? 'ተመለስ' : 'ተጠቃሚዎች  መዝግብ'}
              </Button>
              <Button variant="secondary" onClick={() => handleToggleForm('course')}>
                {activeForm === 'course' ? 'ተመለስ' : 'ትምህርት  መዝግብ'}
              </Button>
              <Button variant="secondary" onClick={() => handleToggleForm('section')}>
                {activeForm === 'section' ? 'ተመለስ' : 'ክፍል  መዝግብ'}
              </Button>
            </div>
            {activeForm === 'teacher' && (
              <AddTeacherForm
                onCancel={() => setActiveForm(null)}
                onSuccess={() => setActiveForm(null)}
              />
            )}
            {activeForm === 'section' && (
              <AddSectionForm
                onCancel={() => setActiveForm(null)}
                onSuccess={() => setActiveForm(null)}
              />
            )}
            {activeForm === 'course' && (
              <AddCourseForm
                onCancel={() => setActiveForm(null)}
                onSuccess={() => setActiveForm(null)}
              />
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  )
}
