'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, BookOpen, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface Course {
  id: number
  course_name: string
  verse: string | null
}

export function CourseManagement() {
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [newCourse, setNewCourse] = useState({ course_name: '', verse: '' })
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)

  const fetchCourses = async () => {
    setLoading(true)
    try {
      const userPhone = localStorage.getItem('userPhone')
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/courses', {
        headers: {
          'x-phone-number': userPhone
        }
      })
      const data = await response.json()
      if (response.ok) {
        setCourses(data.courses)
      } else {
        throw new Error(data.error || 'Failed to fetch courses')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch courses',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)
    try {
      const userPhone = localStorage.getItem('userPhone')
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-number': userPhone
        },
        body: JSON.stringify(newCourse)
      })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Course added successfully'
        })
        setNewCourse({ course_name: '', verse: '' })
        fetchCourses()
      } else {
        throw new Error(result.error || 'Failed to add course')
      }
    } catch (error) {
      console.error('Error adding course:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add course',
        variant: 'destructive'
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCourse) return
    setFormLoading(true)
    try {
      const userPhone = localStorage.getItem('userPhone')
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-number': userPhone
        },
        body: JSON.stringify(editingCourse)
      })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Course updated successfully'
        })
        setEditingCourse(null)
        fetchCourses()
      } else {
        throw new Error(result.error || 'Failed to update course')
      }
    } catch (error) {
      console.error('Error updating course:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update course',
        variant: 'destructive'
      })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteCourse = async (id: number) => {
    setLoading(true)
    try {
      const userPhone = localStorage.getItem('userPhone')
      if (!userPhone) {
        throw new Error('User not authenticated')
      }

      const response = await fetch('/api/courses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-phone-number': userPhone
        },
        body: JSON.stringify({ id })
      })
      const result = await response.json()
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Course deleted successfully'
        })
        fetchCourses()
      } else {
        throw new Error(result.error || 'Failed to delete course')
      }
    } catch (error) {
      console.error('Error deleting course:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete course',
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
          <BookOpen className="h-5 w-5" />
          Course Management
        </CardTitle>
        <CardDescription>
          Manage courses available for scheduling.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={editingCourse ? handleUpdateCourse : handleAddCourse} className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="course_name">Course Name</Label>
            <Input
              id="course_name"
              type="text"
              placeholder="Enter course name"
              value={editingCourse ? editingCourse.course_name : newCourse.course_name}
              onChange={(e) => editingCourse ? setEditingCourse({ ...editingCourse, course_name: e.target.value }) : setNewCourse({ ...newCourse, course_name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="verse">Verse (Optional)</Label>
            <Input
              id="verse"
              type="text"
              placeholder="Enter associated verse"
              value={editingCourse ? (editingCourse.verse || '') : newCourse.verse}
              onChange={(e) => editingCourse ? setEditingCourse({ ...editingCourse, verse: e.target.value }) : setNewCourse({ ...newCourse, verse: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={formLoading} className="flex-1">
              {formLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {editingCourse ? 'Updating...' : 'Adding...'}
                </>
              ) : (
                <>
                  {editingCourse ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                  {editingCourse ? 'Update Course' : 'Add Course'}
                </>
              )}
            </Button>
            {editingCourse && (
              <Button type="button" variant="outline" onClick={() => setEditingCourse(null)}>
                Cancel Edit
              </Button>
            )}
          </div>
        </form>

        <h3 className="text-lg font-semibold mb-4">Existing Courses</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No courses added yet.
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => (
              <Card key={course.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{course.course_name}</p>
                  {course.verse && <p className="text-sm text-muted-foreground">{course.verse}</p>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setEditingCourse(course)}>
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
                          This action cannot be undone. This will permanently delete the course.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteCourse(course.id)}>
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
    </Card>
  )
}
