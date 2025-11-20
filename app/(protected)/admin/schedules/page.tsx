// app/(protected)/admin/schedules/page.tsx (adjust for route group)
'use client'; // Client for state/dropdowns

import { useState, useEffect } from 'react';
import { Schedule } from "@/app/models/models";
import { columns } from "./columns"; // Adapt for Schedule (e.g., date, teacher name, course desc)
import { DataTable } from "./data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, BookOpen } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useToast from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

async function getData(): Promise<Schedule[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/schedules`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch schedules:', res.statusText);
      return [];
    }
    const response = await res.json();
    const schedules: Schedule[] = response.schedules || [];
    return schedules;
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
}

export default async function SchedulesPage() {
  const data = await getData();
  console.log("SCHEDULE DATA:", data);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Schedules</h1>
        <AddScheduleButton />
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">No schedules found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}

// Client component for add modal
function AddScheduleButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<{ id: string; description: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    course_id: '',
    teacher_id: '',
    schedule_date: '', // Full ISO datetime string
  });
  const { toast } = useToast();
  const router = useRouter();

  // Fetch options on open
  useEffect(() => {
    if (open) {
      fetchTeachers();
      fetchCourses();
    }
  }, [open]);

  const fetchTeachers = async () => {
    try {
      const res = await fetch('/api/user/get-teachers', { credentials: 'include' });
      if (res.ok) {
        const { teachers } = await res.json();
        setTeachers(teachers.map((t: any) => ({ id: t.user_id, name: `${t.first_name} ${t.last_name}` })));
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/courses', { credentials: 'include' });
      if (res.ok) {
        const { courses } = await res.json();
        setCourses(courses.map((c: any) => ({ id: c.course_id, description: c.course_description || 'Untitled Course' })));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_id || !formData.teacher_id || !formData.schedule_date) {
      toast({ title: 'Error', description: 'Please fill all fields.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`);
      }
      toast({ title: 'Success!', description: 'Schedule added.' });
      setOpen(false);
      setFormData({ course_id: '', teacher_id: '', schedule_date: '' });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add schedule.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Schedule</DialogTitle>
          <DialogDescription>Assign a teacher to a course on a specific date.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schedule_date">Date & Time <Calendar className="inline h-4 w-4 ml-1" /></Label>
            <Input
              id="schedule_date"
              name="schedule_date"
              type="datetime-local"
              value={formData.schedule_date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Course <BookOpen className="inline h-4 w-4 ml-1" /></Label>
            <Select value={formData.course_id} onValueChange={(value) => handleSelectChange('course_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>{course.description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Teacher</Label>
            <Select value={formData.teacher_id} onValueChange={(value) => handleSelectChange('teacher_id', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a teacher" />
              </SelectTrigger>
              <SelectContent>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
