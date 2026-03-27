'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useTelegram } from '@/components/telegram-provider'
import { Loader2, MapPinPlus, Plus } from 'lucide-react'

interface AddSectionFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AddSectionForm({ onSuccess, onCancel }: AddSectionFormProps) {
  const { webApp } = useTelegram()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    section_name: ''
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

    if (!formData.section_name.trim()) {
      toast({
        title: 'Error',
        description: 'Section name is required',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section_name: formData.section_name.trim()
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Section "${formData.section_name}" added successfully.`,
          duration: 4000
        })
        setFormData({ section_name: '' })
        onSuccess?.()
      } else {
        throw new Error(result.error || 'Failed to add section')
      }
    } catch (error) {
      console.error('Section submission error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add section',
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
          <MapPinPlus className="h-5 w-5" />
          Add New Section
        </CardTitle>
        <CardDescription>Register a section/room for scheduling</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section-name">Section Name</Label>
            <Input
              id="section-name"
              type="text"
              placeholder="Enter section name (e.g., Room 101)"
              value={formData.section_name}
              onChange={(e) => setFormData(prev => ({ ...prev, section_name: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
