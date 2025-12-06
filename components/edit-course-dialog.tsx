'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { BookOpen } from "lucide-react";
import useToast from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Course } from '@/app/models/models';

interface EditCourseDialogProps {
    course: Course;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditCourseDialog({ course, open, onOpenChange }: EditCourseDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        course_description: course.course_description || "",
        objectives: course.objectives ? course.objectives.map(o => o.objective).join('\n') : "",
    });

    const { toast } = useToast();
    const router = useRouter();

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

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

        const objectivesArray = formData.objectives
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        setLoading(true);

        try {
            const res = await fetch(`/api/courses/${course.course_id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    course_description: formData.course_description,
                    objectives: objectivesArray,
                }),
            });

            if (!res.ok) {
                throw new Error("Failed to update course.");
            }

            toast({
                title: "Success!",
                description: "Course updated.",
            });

            onOpenChange(false);
            router.refresh();

        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update course.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Course</DialogTitle>
                    <DialogDescription>Update course description and objectives.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="course_description">
                            Course Description <BookOpen className="inline h-4 w-4 ml-1" />
                        </Label>
                        <Input
                            id="course_description"
                            name="course_description"
                            value={formData.course_description}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="objectives">
                            Objectives (one per line)
                        </Label>
                        <Textarea
                            id="objectives"
                            name="objectives"
                            value={formData.objectives}
                            onChange={handleInputChange}
                            rows={6}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
