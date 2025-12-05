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

interface Course {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

export function AddScheduleButton() {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [sections, setSections] = useState<{ id: string, name: string }[]>([]); // New state for sections
  const [view, setView] = useState<'schedule' | 'create_course' | 'create_teacher'>('schedule');

  // Schedule Form Data
  const [formData, setFormData] = useState({
    course_id: "",
    teacher_id: "",
    schedule_date: "",
  });

  // Create Course Data
  const [newCourse, setNewCourse] = useState({ description: "", objective: "" });

  // Create Teacher Data
  const [newTeacher, setNewTeacher] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    tg_username: "",
    section_id: ""
  });

  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      loadCourses();
      loadTeachers();
      loadSections(); // Fetch sections
    }
  }, [open]);

  async function loadCourses() {
    try {
      const res = await fetch("/api/courses");
      const { courses } = await res.json();
      setCourses(
        courses?.map((c: any) => ({
          id: c.course_id,
          name: c.course_description,
        })) || []
      );
    } catch (e) { console.error(e); }
  }

  async function loadTeachers() {
    try {
      const res = await fetch("/api/user/get-teachers");
      const { teachers } = await res.json();
      setTeachers(
        teachers?.map((t: any) => ({
          id: t.user_id,
          name: `${t.first_name} ${t.last_name}`,
        })) || []
      );
    } catch (e) { console.error(e); }
  }

  async function loadSections() {
    try {
      // Assuming this endpoint exists based on file structure, else we need to find it. 
      // Steps showed `app/api/sections/route.ts` exists.
      const res = await fetch("/api/sections");
      const { sections } = await res.json();
      setSections(
        sections?.map((s: any) => ({
          id: s.section_id,
          name: s.section_name
        })) || []
      );
    } catch (e) { console.error(e); }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const payload = {
      ...formData,
      schedule_date: new Date(formData.schedule_date).toISOString()
    };

    const res = await fetch("/api/schedules", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      toast({ title: "Schedule added" });
      setOpen(false);
      setFormData({
        course_id: '',
        teacher_id: '',
        schedule_date: ''
      });
      router.refresh();
    } else if (res.status === 400) {
      toast({ title: "Schedule data already exists!" });
    }
  };

  const handleCreateCourse = async () => {
    const res = await fetch("/api/courses", {
      method: "POST",
      body: JSON.stringify({
        course_description: newCourse.description,
        objectives: [newCourse.objective] // Simplified for inline
      }),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      toast({ title: "Course created" });
      await loadCourses();
      setView('schedule');
      setNewCourse({ description: "", objective: "" });
    } else {
      toast({ title: "Failed to create course", variant: "destructive" });
    }
  };

  const handleCreateTeacher = async () => {
    const res = await fetch("/api/teachers", {
      method: "POST",
      body: JSON.stringify(newTeacher),
      headers: { "Content-Type": "application/json" }
    });

    if (res.ok) {
      toast({ title: "Teacher created" });
      await loadTeachers();
      setView('schedule');
      setNewTeacher({ first_name: "", last_name: "", phone_number: "", tg_username: "", section_id: "" });
    } else {
      const err = await res.json();
      toast({ title: err.error || "Failed to create teacher", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setView('schedule'); }}>
      <DialogTrigger asChild>
        <Button>Add Schedule</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {view === 'schedule' ? 'Add Schedule' : view === 'create_course' ? 'Create New Course' : 'Create New Teacher'}
          </DialogTitle>
        </DialogHeader>

        {view === 'schedule' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Label>Date</Label>
            <Input
              type="datetime-local"
              value={formData.schedule_date}
              onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
            />

            <div className="flex flex-col gap-2">
              <Label>Course</Label>
              {courses.length === 0 ? (
                <Button type="button" variant="outline" onClick={() => setView('create_course')}>+ Create Course</Button>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={formData.course_id}
                    onValueChange={(v) => setFormData({ ...formData, course_id: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setView('create_course')}>+</Button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Teacher</Label>
              {teachers.length === 0 ? (
                <Button type="button" variant="outline" onClick={() => setView('create_teacher')}>+ Create Teacher</Button>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={formData.teacher_id}
                    onValueChange={(v) => setFormData({ ...formData, teacher_id: v })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setView('create_teacher')}>+</Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit">Save Schedule</Button>
            </DialogFooter>
          </form>
        )}

        {view === 'create_course' && (
          <div className="space-y-4">
            <div><Label>Description</Label><Input value={newCourse.description} onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} /></div>
            <div><Label>Objective</Label><Input value={newCourse.objective} onChange={e => setNewCourse({ ...newCourse, objective: e.target.value })} /></div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setView('schedule')}>Back</Button>
              <Button onClick={handleCreateCourse}>Create Course</Button>
            </DialogFooter>
          </div>
        )}

        {view === 'create_teacher' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>First Name</Label><Input value={newTeacher.first_name} onChange={e => setNewTeacher({ ...newTeacher, first_name: e.target.value })} /></div>
              <div><Label>Last Name</Label><Input value={newTeacher.last_name} onChange={e => setNewTeacher({ ...newTeacher, last_name: e.target.value })} /></div>
            </div>
            <div><Label>Phone</Label><Input value={newTeacher.phone_number} onChange={e => setNewTeacher({ ...newTeacher, phone_number: e.target.value })} /></div>
            <div><Label>Telegram Username</Label><Input value={newTeacher.tg_username} onChange={e => setNewTeacher({ ...newTeacher, tg_username: e.target.value })} /></div>
            <div>
              <Label>Section</Label>
              <Select value={newTeacher.section_id} onValueChange={v => setNewTeacher({ ...newTeacher, section_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setView('schedule')}>Back</Button>
              <Button onClick={handleCreateTeacher}>Create Teacher</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
