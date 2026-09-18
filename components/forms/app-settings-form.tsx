'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import useToast from '@/hooks/use-toast'

interface AppSettingsFormProps {
  initialSettings: {
    app_name: string
    bot_description: string | null
    bot_short_description: string | null
  }
}

export function AppSettingsForm({ initialSettings }: AppSettingsFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [appName, setAppName] = useState(initialSettings.app_name)
  const [botDescription, setBotDescription] = useState(initialSettings.bot_description || '')
  const [botShortDescription, setBotShortDescription] = useState(initialSettings.bot_short_description || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_name: appName,
          bot_description: botDescription,
          bot_short_description: botShortDescription,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update settings')

      toast({ title: 'Success', description: 'Settings updated successfully' })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-4 py-3">
        <Label htmlFor="app_name">የቦት ስም (Bot / App Name)</Label>
        <Input
          id="app_name"
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          maxLength={64}
          required
        />
        <p className="mt-1 text-xs text-muted-foreground">
          ይህ ስም በመተግበሪያው ውስጥ እና በቴሌግራም ቦት መገለጫ ላይ ይታያል።
        </p>
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="bot_short_description">አጭር መግለጫ (Short Description)</Label>
        <Textarea
          id="bot_short_description"
          value={botShortDescription}
          onChange={(e) => setBotShortDescription(e.target.value)}
          maxLength={120}
          rows={2}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          በቻት ውስጥ ከቦቱ ጋር ሲጋራ ይታያል። (ከፍተኛ 120 ፊደላት)
        </p>
      </div>
      <div className="px-4 py-3">
        <Label htmlFor="bot_description">ሙሉ መግለጫ (Description)</Label>
        <Textarea
          id="bot_description"
          value={botDescription}
          onChange={(e) => setBotDescription(e.target.value)}
          maxLength={512}
          rows={4}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          ቦቱ ገና ካልጀመረ በቻት ውስጥ ይታያል። (ከፍተኛ 512 ፊደላት)
        </p>
      </div>
      <div className="flex items-center justify-end gap-2 px-4 py-3">
        <Button type="submit" disabled={loading}>
          {loading ? 'በመመዝገብ ላይ...' : 'አስቀምጥ'}
        </Button>
      </div>
    </form>
  )
}
