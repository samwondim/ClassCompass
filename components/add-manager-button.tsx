
'use client';

import { useState } from 'react';
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

export function AddManagerButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    tg_username: '',
    phone_number: ''
  });
  const { toast } = useToast();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Ensures cookies (session) sent client-side
        body: JSON.stringify({ ...formData, user_role: 'MANAGER' }),
      });
      if (!res.ok) {
        throw new Error(`Failed: ${res.status} ${res.statusText}`);
      }
      toast({ title: 'Success!', description: 'Manager added.' });
      setOpen(false);
      setFormData({ first_name: '', last_name: '', tg_username: '', phone_number: '' });
      router.refresh(); // Re-fetch data server-side
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add manager.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-auto pb-3'>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Manager
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Manager</DialogTitle>
            <DialogDescription>Enter details for the new manager.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name</Label>
              <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name</Label>
              <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tg_username">Telegram Username</Label>
              <Input id="tg_username" name="tg_username" value={formData.tg_username} onChange={handleInputChange} placeholder="username" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Manager'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
