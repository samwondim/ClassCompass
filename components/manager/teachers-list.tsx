'use client'

import { useEffect, useState } from 'react'
import { Users, Loader2, Edit, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog' // Add this import for Dialog
import { Input } from '@/components/ui/input' // Add this for form inputs
import { Label } from '@/components/ui/label' // Add this for form labels

interface Teacher {
  teacher_id: number
  teacher: {
    first_name: string
    last_name: string | null
  }
  section?: {
    section_name: string | null
  } | null
}

export function TeachersList() {
  const { toast } = useToast()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null)
  const [formData, setFormData] = useState<{ first_name: string; last_name: string }>({
    first_name: '',
    last_name: ''
  })

  const fetchTeachers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/teachers')
      const data = await response.json()
      if (response.ok) {
        setTeachers(data.teachers)
      } else {
        throw new Error(data.error || 'Failed to fetch teachers')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeachers()
  }, [])

  const handleEditClick = (teacher: Teacher) => {
    setEditingTeacher(teacher)
    setFormData({
      first_name: teacher.teacher.first_name,
      last_name: teacher.teacher.last_name || ''
    })
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleUpdateTeacher = async () => {
    if (!editingTeacher) return
    setLoading(true)
    try {
      const response = await fetch('/api/teachers', {
        method: 'PUT', // Or 'PATCH' if your API uses that
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingTeacher.teacher_id,
          first_name: formData.first_name,
          last_name: formData.last_name || null // Allow null if empty
        })
      })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Teacher updated successfully'
        })
        fetchTeachers()
        setEditingTeacher(null) // Close dialog
      } else {
        throw new Error(result.error || 'Failed to update teacher')
      }
    } catch (err) {
      console.error('Error updating teacher:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update teacher',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTeacher = async (id: number) => {
    setLoading(true)
    try {
      const response = await fetch('/api/teachers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id })
      })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Teacher deleted successfully'
        })
        fetchTeachers()
      } else {
        throw new Error(result.error || 'Failed to delete teacher')
      }
    } catch (err) {
      console.error('Error deleting teacher:', err)
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete teacher',
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
          <Users className="h-5 w-5" />
          Teachers
        </CardTitle>
        <CardDescription>Manage your teaching staff.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p>{error}</p>
            <Button onClick={fetchTeachers} className="mt-4">Retry</Button>
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <h3 className="font-medium text-sm">No Teachers Added</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Use the Add Teacher button on the Dashboard to create your first teacher.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {teachers.map((teacher) => (
              <Card key={teacher.teacher_id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {teacher.teacher.first_name} {teacher.teacher.last_name || ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {teacher.section?.section_name
                      ? `Section: ${teacher.section.section_name}`
                      : 'No section assigned'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEditClick(teacher)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the teacher.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteTeacher(teacher.teacher_id)}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && setEditingTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>Update the teacher's information below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first_name" className="text-right">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last_name" className="text-right">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleFormChange}
                className="col-span-3"
              />
            </div>

          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleUpdateTeacher} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
