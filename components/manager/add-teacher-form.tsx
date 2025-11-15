'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, UserPlus } from 'lucide-react'

interface Section {
  section_id: string
  section_name: string | null
}

interface AddTeacherFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AddTeacherForm({ onSuccess, onCancel }: AddTeacherFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<Section[]>([])

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    tg_username: '',
    user_role: '',
    section_id: ''
  })

  // Fetch all sections for assignment
  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections')
      const data = await response.json()
      if (response.ok) {
        setSections(data.sections)
      } else {
        throw new Error(data.error || 'Failed to fetch sections')
      }
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch sections',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchSections()
  }, [])

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.first_name.trim() || !formData.phone_number.trim() || !formData.tg_username.trim()) {
      toast({ title: 'Error', description: 'First Name, Telegram Username and phone number are required', variant: 'destructive' })
      return
    }

    if (formData.user_role === 'ADMIN') {
      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        const result = await response.json()
        if (response.ok) {
          toast({ title: 'Success', description: 'User added successfully' })
          setFormData({
            first_name: '',
            last_name: '',
            phone_number: '',
            tg_username: '',
            user_role: 'ADMIN',
            section_id: ''
          })
          onSuccess?.()
          return
        } else {
          throw new Error(result.error || 'Failed to add user')
        }
      } catch (error) {
        toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add user', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }

    if (formData.user_role === 'MANAGER') {
      try {
        const response = await fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        const result = await response.json()
        if (response.ok) {
          toast({ title: 'Success', description: 'User added successfully' })
          setFormData({
            first_name: '',
            last_name: '',
            phone_number: '',
            tg_username: '',
            user_role: 'MANAGER',
            section_id: ''
          })
          onSuccess?.()
          return
        } else {
          throw new Error(result.error || 'Failed to add user')
        }
      } catch (error) {
        toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add user', variant: 'destructive' })
      } finally {
        setLoading(false)
      }
    }
    if ((formData.user_role === 'TEACHER' || formData.user_role === 'MANAGER') && formData.section_id === '') {
      toast({ title: 'Error', description: `Please add section name`, variant: 'destructive' })
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()
      if (response.ok) {
        toast({ title: 'Success', description: 'User added successfully' })
        setFormData({
          first_name: '',
          last_name: '',
          phone_number: '',
          tg_username: '',
          user_role: 'TEACHER',
          section_id: ''
        })
        onSuccess?.()
      } else {
        throw new Error(result.error || 'Failed to add user')
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to add user', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Add New User
        </CardTitle>
        <CardDescription>Add a new user and define their role.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="first-name">First Name</Label>
            <Input id="first-name" value={formData.first_name} onChange={handleInputChange('first_name')} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last-name">Last Name</Label>
            <Input id="last-name" value={formData.last_name} onChange={handleInputChange('last_name')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" value={formData.phone_number} onChange={handleInputChange('phone_number')} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Telegram Username</Label>
            <Input id="username" value={formData.tg_username} onChange={handleInputChange('tg_username')} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-role">Role</Label>
            <Select value={formData.user_role} onValueChange={(value) => setFormData(prev => ({ ...prev, user_role: value, section_id: '' }))}>
              <SelectTrigger id="user-role">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {["ADMIN", "MANAGER", "TEACHER"].map(role => (
                  <SelectItem key={role} value={role}>{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conditionally show section dropdown */}
          {(formData.user_role === 'TEACHER' || formData.user_role === 'MANAGER') && (
            <div className="space-y-2">
              <Label htmlFor="section">Assign Section</Label>
              <Select value={formData.section_id} onValueChange={(value) => setFormData(prev => ({ ...prev, section_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={formData.user_role === 'TEACHER' ? 'Select teaching section' : 'Select managed section'} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map(section => (
                    <SelectItem key={section.section_id} value={section.section_id}>
                      {section.section_name || `Section ${section.section_id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2">
            {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>}
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</> : <><Plus className="mr-2 h-4 w-4" />Add User</>}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
