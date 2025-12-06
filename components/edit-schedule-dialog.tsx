"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useToast from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Schedule } from "@/app/models/models";
import { format } from "date-fns";

interface Course {
    id: string;
    name: string;
}

interface Teacher {
    id: string;
    name: string;
}

interface EditScheduleDialogProps {
    schedule: Schedule;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditScheduleDialog({ schedule, open, onOpenChange }: EditScheduleDialogProps) {
    const [courses, setCourses] = useState<Course[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [formData, setFormData] = useState({
        course_id: schedule.course.course_id,
        teacher_id: schedule.teacher.user_id,
        schedule_date: format(new Date(schedule.schedule_date), "yyyy-MM-dd'T'HH:mm"),
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            course_id: formData.course_id,
            teacher_id: formData.teacher_id,
            schedule_date: new Date(formData.schedule_date).toISOString()
        };

        const res = await fetch(`/api/schedules/${schedule.schedule_id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
            headers: { "Content-Type": "application/json" },
        });

        if (res.ok) {
            toast({ title: "Schedule updated" });
            onOpenChange(false);
            router.refresh();
        } else {
            const err = await res.json().catch(() => ({}));
            toast({ title: err.error || "Failed to update schedule", variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Schedule</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Label>Date</Label>
                    <Input
                        type="datetime-local"
                        value={formData.schedule_date}
                        onChange={(e) => setFormData({ ...formData, schedule_date: e.target.value })}
                        required
                    />

                    <div className="flex flex-col gap-2">
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
                    </div>

                    <div className="flex flex-col gap-2">
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
                    </div>

                    <DialogFooter>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
