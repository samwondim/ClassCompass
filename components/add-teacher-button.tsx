'use client';

import { useEffect, useState } from 'react';
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
import { Plus } from "lucide-react";
import useToast from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export function AddTeacherButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingSections, setLoadingSections] = useState(true);

  const [sections, setSections] = useState<{ section_id: string; section_name: string }[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    tg_username: '',
    phone_number: '',
    section_id: '',
  });

  const { toast } = useToast();
  const router = useRouter();

  // Fetch ONLY manager's assigned sections
  useEffect(() => {
    async function fetchManagerSections() {
      setLoadingSections(true);
      try {
        const res = await fetch("/api/managers/sections");
        if (!res.ok) {
          throw new Error('Failed to fetch your assigned sections');
        }
        const data = await res.json();
        const managerSections = data.sections || [];
        setSections(managerSections);

        // Auto-select if only one section
        if (managerSections.length === 1) {
          setFormData(prev => ({ ...prev, section_id: managerSections[0].section_id }));
        }
      } catch (err) {
        console.error("Failed to fetch sections:", err);
        toast({
          title: 'Error',
          description: 'Failed to load your sections. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setLoadingSections(false);
      }
    }
    if (open) {
      fetchManagerSections();
    }
  }, [open, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.section_id) {
      toast({
        title: 'Error',
        description: 'Please select a section',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teachers/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_role: 'TEACHER' }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to add teacher');
      }

      toast({ title: 'Success!', description: 'Teacher added successfully.' });
      setOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        tg_username: '',
        phone_number: '',
        section_id: '',
      });
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add teacher.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto pb-3">
      <Dialog open={open} onOpenChange={setOpen} >
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>Enter details for the new teacher.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
            </div>

            {/* Telegram Username */}
            <div className="space-y-2">
              <Label htmlFor="tg_username">Telegram Username</Label>
              <Input id="tg_username" name="tg_username" value={formData.tg_username} onChange={handleInputChange} required />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
            </div>

            {/* Section Assignment - Auto-selected if only one, dropdown if multiple */}
            <div className="space-y-2">
              <Label>Assign to Section</Label>
              {loadingSections ? (
                <div className="border p-2 rounded text-sm text-muted-foreground">
                  Loading sections...
                </div>
              ) : sections.length === 0 ? (
                <div className="border p-2 rounded text-sm text-destructive">
                  You are not assigned to any sections. Please contact an admin.
                </div>
              ) : sections.length === 1 ? (
                <Input
                  value={sections[0].section_name}
                  disabled
                  className="bg-muted"
                />
              ) : (
                <Select
                  onValueChange={(value) => setFormData({ ...formData, section_id: value })}
                  value={formData.section_id}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.section_id} value={s.section_id}>
                        {s.section_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Teacher'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
