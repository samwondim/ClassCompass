
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, BookOpen } from "lucide-react";
import useToast from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AddCourseButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    course_description: "",
    objectives: "",
  });

  const { toast } = useToast();
  const router = useRouter();


  // Handle changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };


  // Submit data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.course_description.trim()) {
      toast({
        title: "Error",
        description: "Description is required.",
        variant: "destructive",
      });
      return;
    }

    // Convert textarea text → array of one-per-line objectives
    const objectivesArray = formData.objectives
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    setLoading(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          course_description: formData.course_description,
          objectives: objectivesArray,  // ← match backend API
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to add course.");
      }

      toast({
        title: "Success!",
        description: "Course added.",
      });

      setOpen(false);
      setFormData({ course_description: "", objectives: "" });
      router.refresh();

    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add course.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  // -------- UI Dialog ----------
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

          {/* Course Description */}
          <div className="space-y-2">
            <Label htmlFor="course_description">
              Course Description <BookOpen className="inline h-4 w-4 ml-1" />
            </Label>
            <Input
              id="course_description"
              name="course_description"
              value={formData.course_description}
              onChange={handleInputChange}
              placeholder="e.g., Introduction to Bible Stories"
              required
            />
          </div>

          {/* Objectives */}
          <div className="space-y-2">
            <Label htmlFor="objectives">
              Objectives (one per line)
            </Label>

            <Textarea
              id="objectives"
              name="objectives"
              value={formData.objectives}
              onChange={handleInputChange}
              placeholder={`e.g.,
Understand key stories
Apply lessons to daily life`}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Course"}
            </Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
