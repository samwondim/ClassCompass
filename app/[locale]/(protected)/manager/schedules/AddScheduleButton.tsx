"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useToast from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export function AddScheduleButton() {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<{ id: string, name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string, name: string }[]>([]);
  const [formData, setFormData] = useState({
    course_id: "",
    teacher_id: "",
    schedule_date: "",
  });

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadCourses();
      loadTeachers();
    }
  }, [open]);

  async function loadCourses() {
    const res = await fetch("/api/courses");
    const { courses } = await res.json();
    setCourses(
      courses.map((c: any) => ({
        id: c.course_id,
        name: c.course_name || c.course_description, // Use Name if available
      }))
    );
  }

  async function loadTeachers() {
    const res = await fetch("/api/user/get-teachers");
    const { teachers } = await res.json();
    console.log("client side", teachers)
    setTeachers(
      teachers.map((t: any) => ({
        id: t.user_id,
        name: `${t.first_name} ${t.last_name}`,
      }))
    );
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch("/api/schedules", {
      method: "POST",
      body: JSON.stringify(formData),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast({ title: "Schedule added" });
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Schedule</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Schedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <Label>Date</Label>
          <Input
            type="datetime-local"
            value={formData.schedule_date}
            onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
          />

          <Label>Course</Label>
          <Select
            value={formData.course_id}
            onValueChange={(v) => setFormData({ ...formData, course_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label>Teacher</Label>
          <Select
            value={formData.teacher_id}
            onValueChange={(v) => setFormData({ ...formData, teacher_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button type="submit">Save</Button>
          </DialogFooter>

        </form>
      </DialogContent>
    </Dialog>
  );
}
