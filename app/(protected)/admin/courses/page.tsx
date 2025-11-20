// app/(protected)/admin/courses/page.tsx (adjust for route group)
'use client'; // Client for state

import { useState } from 'react';
import { Course } from "@/app/models/models";
import { columns } from "./columns"; // Adapt for Course (e.g., description, creator, objectives count)
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
import { Textarea } from "@/components/ui/textarea"; // For objectives
import { Label } from "@/components/ui/label";
import { Plus, BookOpen } from "lucide-react";
import useToast from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getSession } from '@/utils/session'; // For current user

async function getData(): Promise<Course[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/courses`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error('Failed to fetch courses:', res.statusText);
      return [];
    }
    const response = await res.json();
    const courses: Course[] = response.courses || [];
    return courses;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export default async function CoursesPage() {
  const data = await getData();
  console.log("COURSE DATA:", data);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <AddCourseButton />
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">No courses found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}

// Client component for add modal
function AddCourseButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    course_description: '',
    objectives: '', // Comma-separated or JSON; parse in API
  });
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.course_description.trim()) {
      toast({ title: 'Error', description: 'Description is required.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData }),
      });
      if (!res.ok) {
        throw new Error(`Failed: ${res.status}`);
      }
      toast({ title: 'Success!', description: 'Course added.' });
      setOpen(false);
      setFormData({ course_description: '', objectives: '' });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add course.',
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
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>Create a new Sunday School course with objectives.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course_description">Course Description <BookOpen className="inline h-4 w-4 ml-1" /></Label>
            <Input
              id="course_description"
              name="course_description"
              value={formData.course_description}
              onChange={handleInputChange}
              placeholder="e.g., Introduction to Bible Stories"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="objectives">Objectives (one per line)</Label>
            <Textarea
              id="objectives"
              name="objectives"
              value={formData.objectives}
              onChange={handleInputChange}
              placeholder="e.g., Understand key stories&#10;Apply lessons to daily life"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
