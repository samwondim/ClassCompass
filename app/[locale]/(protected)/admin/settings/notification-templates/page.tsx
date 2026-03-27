'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"

const NOTIFICATION_TYPES = [
  'SUNDAY_REMINDER',
  'MISSING_SCHEDULE',
  'SCHEDULE_CHANGE',
  'UNAVAILABILITY',
  'EMPTY_BOARD',
  'WEEKLY_REPORT',
  'SECTION_CHANGE'
]

export default function NotificationTemplatesPage() {
  const t = useTranslations()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/notification-templates')
      const data = await res.json()
      const templateMap: Record<string, string> = {}
      data.templates.forEach((t: { key: string, message: string }) => {
        templateMap[t.key] = t.message
      })
      setTemplates(templateMap)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast({ title: t('Common.Error'), description: 'Failed to fetch templates', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const saveTemplate = async (key: string, message: string) => {
    try {
      await fetch('/api/admin/notification-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, message }),
      })
      toast({ title: t('Common.Success'), description: `Template ${key} updated` })
    } catch (error) {
      console.error('Error saving template:', error)
      toast({ title: t('Common.Error'), description: 'Failed to save template', variant: 'destructive' })
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">{t('Admin.NotificationTemplates')}</h1>
      {loading ? (
        <p>{t('Common.Loading')}</p>
      ) : (
        NOTIFICATION_TYPES.map(key => (
          <Card key={key}>
            <CardHeader>
              <CardTitle>{key}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={templates[key] || ''}
                onChange={(e) => setTemplates({ ...templates, [key]: e.target.value })}
                placeholder="Enter custom message"
              />
              <Button onClick={() => saveTemplate(key, templates[key])}>
                {t('Common.Save')}
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
