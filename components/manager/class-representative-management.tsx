'use client'
import { useEffect, useState } from 'react'
import { Loader2, UserCog, AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog' // Add this import
import { Input } from '@/components/ui/input' // Add this import
import { Label } from '@/components/ui/label' // Add this import

export function ClassRepresentativeManagement() {
  const { toast } = useToast()
  const [sections, setSections] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState<any | null>(null)
  const [formData, setFormData] = useState<{ section_name: string; managerId: string | null }>({
    section_name: '',
    managerId: null
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [sectionRes, managerRes] = await Promise.all([
        fetch('/api/sections'),
        fetch('/api/user?user_role=MANAGER')
      ])
      const sectionData = await sectionRes.json()
      const managerData = await managerRes.json()
      if (!sectionRes.ok || !managerRes.ok) throw new Error('Failed to load data')
      setSections(sectionData.sections)
      setManagers(managerData.users)
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = (section: any) => {
    setEditingSection(section)
    setFormData({
      section_name: section.section_name,
      managerId: section.manager_id || null
    })
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  // Updated handler
  const handleManagerChange = (value: string) => {
    setFormData({
      ...formData,
      managerId: value === 'unassigned' ? null : value
    })
  }

  async function handleUpdateSection() {
    if (!editingSection) return
    try {
      const res = await fetch('/api/sections', {
        method: 'PUT', // Assuming your API supports PUT for full section updates; adjust to PATCH if needed
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId: editingSection.section_id,
          section_name: formData.section_name,
          managerId: formData.managerId
        })
      })
      const data = await res.json()
      if (res.ok) {
        toast({
          title: 'Section Updated',
          description: 'Section details successfully updated.',
        })
        fetchData()
        setEditingSection(null) // Close dialog
      } else {
        throw new Error(data.error || 'Update failed')
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update section',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Manage Section Managers
        </CardTitle>
        <CardDescription>
          Assign or update the manager responsible for each class section.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-amber-500" />
            <p>No sections available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.section_id}
                className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleEditClick(section)}
              >
                <div>
                  <h4 className="font-semibold">{section.section_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Manager:{' '}
                    {section.manager
                      ? `${section.manager.first_name || ''} ${section.manager.last_name || ''}`.trim() ||
                      section.manager.tg_username
                      : 'Unassigned'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Section</DialogTitle>
            <DialogDescription>Update the section name and assigned manager.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="section_name" className="text-right">Section Name</Label>
              <Input
                id="section_name"
                name="section_name"
                value={formData.section_name}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">Manager</Label>
              <Select
                onValueChange={handleManagerChange}
                defaultValue={formData.managerId || 'unassigned'}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.first_name ? `${m.first_name} ${m.last_name || ''}` : m.tg_username}
                    </SelectItem>
                  ))}
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateSection} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
