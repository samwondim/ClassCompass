'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useTelegram } from '@/components/telegram-provider'
import { BookPlus, Loader2, Plus } from 'lucide-react'

interface AddCourseFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AddCourseForm({ onSuccess, onCancel }: AddCourseFormProps) {
  const { webApp } = useTelegram()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    course_name: '',
    verse: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!webApp) {
      toast({
        title: 'Error',
        description: 'Telegram WebApp not initialized',
        variant: 'destructive'
      })
      return
    }

    if (!formData.course_name.trim()) {
      toast({
        title: 'Error',
        description: 'የ ትምህርት ስም  ያስፈልጋል',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-telegram-init-data': webApp.initData
        },
        body: JSON.stringify({
          course_name: formData.course_name.trim(),
          verse: formData.verse.trim() || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: `"${formData.course_name}" የተስኘው  ትምህርት በስኬታማነት ተመዝግቧል`,
          duration: 4000
        })
        setFormData({ course_name: '', verse: '' })
        onSuccess?.()
      } else {
        throw new Error(result.error || 'Failed to add course')
      }
    } catch (error) {
      console.error('Course submission error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add course',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ትምህርት መዝግ	
          <BookPlus className="h-5 w-5" />
        </CardTitle>
        <CardDescription>ትምህርት ፕሮግራም  መመዝገቢያ ቅጽ</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-name">የትምህርት ርእስ</Label>
            <Input
              id="course-name"
              type="text"
              placeholder="Enter course name"
              value={formData.course_name}
              onChange={(e) => setFormData(prev => ({ ...prev, course_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-verse">ጥቅስ</Label>
            <Input
              id="course-verse"
              type="text"
              placeholder="Enter scripture verse"
              value={formData.verse}
              onChange={(e) => setFormData(prev => ({ ...prev, verse: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                አቋርጥ
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ጥቂት ይታገሱ...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  መዝግብ
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
