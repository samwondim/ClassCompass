'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Loader2, Users, UserPlus, UserMinus, Phone, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

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

interface Teacher {
  id: number
  first_name: string
  last_name: string | null
  phone_number: string
  telegram_id: string | null
  is_manager: boolean
  is_class_rep: boolean
  _count: {
    schedules: number
  }
}

interface RepresentativeData {
  teachers: Teacher[]
  representative: {
    id: number
    name: string
  }
}

export function TeacherManagement() {
  const { toast } = useToast()
  const [data, setData] = useState<RepresentativeData | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [availableTeachers, setAvailableTeachers] = useState<Teacher[]>([])
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const userPhone = localStorage.getItem('userPhone')
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/representative/teachers', {
        headers: {
          'x-phone-number': userPhone
        }
      })
      const result = await response.json()
      if (response.ok) {
        setData(result)
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableTeachers = async () => {
    try {
      const userPhone = localStorage.getItem('userPhone')
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/teachers', {
        headers: {
          'x-phone-number': userPhone
        }
      })
      const result = await response.json()
      if (response.ok) {
        // Filter out teachers who are already assigned to this representative or are class reps
        const assignedIds = data?.teachers.map(t => t.id) || []
        const available = result.teachers.filter((teacher: Teacher) =>
          !assignedIds.includes(teacher.id) && !teacher.is_class_rep
        )
        setAvailableTeachers(available)
      }
    } catch (error) {
      console.error('Error fetching available teachers:', error)
    }
  }

  useEffect(() => {
    const userPhone = localStorage.getItem('userPhone')
    if (userPhone) {
      fetchData()
    }
  }, [])

  useEffect(() => {
    if (showAssignForm) {
      fetchAvailableTeachers()
    }
  }, [showAssignForm, data])

  const handleAssignTeacher = async () => {
    if (!selectedTeacherId) return

    setActionLoading(true)
    try {
      const userPhone = localStorage.getItem('userPhone')
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/representative/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-number': userPhone
        },
        body: JSON.stringify({ teacher_id: selectedTeacherId })
      })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Teacher assigned successfully'
        })
        setSelectedTeacherId('')
        setShowAssignForm(false)
        fetchData()
      } else {
        throw new Error(result.error || 'Failed to assign teacher')
      }
    } catch (error) {
      console.error('Error assigning teacher:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to assign teacher',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveTeacher = async (teacherId: number) => {
    setActionLoading(true)
    try {
      const userPhone = localStorage.getItem('userPhone')
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/representative/teachers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-number': userPhone
        },
        body: JSON.stringify({ teacher_id: teacherId })
      })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Teacher removed successfully'
        })
        fetchData()
      } else {
        throw new Error(result.error || 'Failed to remove teacher')
      }
    } catch (error) {
      console.error('Error removing teacher:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove teacher',
        variant: 'destructive'
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Representative Info */}
      {data?.representative && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Representative Dashboard
            </CardTitle>
            <CardDescription>
              Managing teachers for {data.representative.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 bg-sky-50 rounded-lg">
                <div className="text-2xl font-bold text-sky-700">{data.teachers.length}</div>
                <div className="text-sm text-sky-600">Assigned Teachers</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Teachers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assigned Teachers</CardTitle>
              <CardDescription>Teachers under your management</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data?.teachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No teachers assigned yet</p>
              <p className="text-sm">Assign teachers to start managing their schedules</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.teachers.map(teacher => (
                <Card key={teacher.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">
                          {teacher.first_name} {teacher.last_name || ''}
                        </h3>
                        {teacher.is_manager && (
                          <Badge variant="secondary">Manager</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {teacher.phone_number}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {teacher._count.schedules} schedules
                        </div>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={actionLoading}>
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Teacher</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {teacher.first_name} {teacher.last_name || ''} from your management?
                            This will not delete the teacher, just remove them from your assigned teachers.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemoveTeacher(teacher.id)}>
                            Remove
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
      </Card>

      {/* Assign Teacher Dialog */}
      {showAssignForm && (
        <Card>
          <CardHeader>
            <CardTitle>Assign New Teacher</CardTitle>
            <CardDescription>Select a teacher to assign to your management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teacher-select">Available Teachers</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.first_name} {teacher.last_name || ''} - {teacher.phone_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAssignTeacher}
                disabled={!selectedTeacherId || actionLoading}
                className="flex-1"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Teacher
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAssignForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
