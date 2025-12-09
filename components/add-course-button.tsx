
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
import { Plus, BookOpen, ScrollText, Target, X, Trash2 } from "lucide-react";
import useToast from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AddCourseButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    course_name: "",
    verse: "",
    course_description: "",
  });

  const [objectives, setObjectives] = useState<string[]>([""]);

  const { toast } = useToast();
  const router = useRouter();


  // Handle text input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle objective changes
  const handleObjectiveChange = (index: number, value: string) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };

  const addObjective = () => {
    setObjectives([...objectives, ""]);
  };

  const removeObjective = (index: number) => {
    const newObjectives = [...objectives];
    newObjectives.splice(index, 1);
    setObjectives(newObjectives);
  };


  // Submit data
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.course_name.trim()) {
      toast({
        title: "Error",
        description: "Course Name is required.",
        variant: "destructive",
      });
      return;
    }

    const validObjectives = objectives
      .map((obj) => obj.trim())
      .filter((obj) => obj.length > 0);

    setLoading(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          course_name: formData.course_name,
          verse: formData.verse,
          course_description: formData.course_description,
          objectives: validObjectives,
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
      setOpen(false);
      setFormData({ course_name: "", verse: "", course_description: "" });
      setObjectives([""]);
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

          {/* Course Name */}
          <div className="space-y-2">
            <Label htmlFor="course_name">
              Course Name <BookOpen className="inline h-4 w-4 ml-1" />
            </Label>
            <Input
              id="course_name"
              name="course_name"
              value={formData.course_name}
              onChange={handleInputChange}
              placeholder="e.g., Biblical Foundations"
              required
            />
          </div>

          {/* Verse */}
          <div className="space-y-2">
            <Label htmlFor="verse">
              Key Verse <ScrollText className="inline h-4 w-4 ml-1" />
            </Label>
            <Input
              id="verse"
              name="verse"
              value={formData.verse}
              onChange={handleInputChange}
              placeholder="e.g., Joshua 1:8"
            />
          </div>

          {/* Course Description */}
          <div className="space-y-2">
            <Label htmlFor="course_description">
              Description
            </Label>
            <Textarea
              id="course_description"
              name="course_description"
              value={formData.course_description}
              onChange={handleInputChange}
              placeholder="Brief overview of the course..."
            />
          </div>

          {/* Objectives */}
          <div className="space-y-2">
            <Label>
              Objectives <Target className="inline h-4 w-4 ml-1" />
            </Label>
            <div className="space-y-2">
              {objectives.map((objective, index) => (
                <div key={index} className="flex gap-2 items-center animated-in fade-in slide-in-from-top-1">
                  <Input
                    value={objective}
                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                    placeholder={`Objective ${index + 1}`}
                  />
                  {objectives.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeObjective(index)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addObjective}
                className="w-full mt-2 border-dashed"
              >
                <Plus className="mr-2 h-3 w-3" />
                Add Objective
              </Button>
            </div>
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
