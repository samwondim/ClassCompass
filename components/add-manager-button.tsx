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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AddManagerButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    tg_username: '',
    phone_number: ''
  });

  const { toast } = useToast();
  const router = useRouter();

  // --- Load Sections ---
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch("/api/sections");
        const data = await res.json();
        setSections(data.sections || []);
      } catch (error) {
        console.error(error);
        setSections([]);
      }
    };
    fetchSections();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          user_role: "MANAGER",
          sectionIds: selectedSections
        }),
      });

      if (!res.ok) throw new Error(`Failed: ${res.status}`);

      toast({ title: 'Success', description: 'Manager added!' });

      setOpen(false);
      setFormData({
        first_name: '',
        last_name: '',
        tg_username: '',
        phone_number: ''
      });
      setSelectedSections([]);

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add manager",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto pb-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            የክፍል አስተዳዳሪ መዝግብ
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>አዲስ አስተዳዳሪ መመዝገብያ ቅጽ</DialogTitle>
            <DialogDescription>የአስተዳዳሪውን መረጃዎች እዚህ  ይሙሉ</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="first_name">ስም</Label>
              <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} required />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="last_name">የአባት ስም</Label>
              <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} required />
            </div>

            {/* Telegram Username */}
            <div className="space-y-2">
              <Label htmlFor="tg_username">ተሌግራም ዩዘርኔም</Label>
              <Input id="tg_username" name="tg_username" value={formData.tg_username} onChange={handleInputChange} required />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone_number">የስልክ ቁጥር</Label>
              <Input id="phone_number" name="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
            </div>

            {/* -------- SECTION SELECT -------- */}
            <div className="space-y-2">
              <Label>ሚያስተዳድረው ክፍል</Label>

              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="ክፍል ይምረጡ" />
                </SelectTrigger>

                <SelectContent>
                  {sections.map((sec: any) => (
                    <SelectItem
                      key={sec.section_id}
                      value={sec.section_id}
                      onClick={() => toggleSection(sec.section_id)}
                    >
                      <span className={selectedSections.includes(sec.section_id)
                        ? "font-bold"
                        : ""}>
                        {sec.section_name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Show selected sections */}
              <div className="text-sm text-muted-foreground">
                Selected: {selectedSections.length > 0
                  ? selectedSections.length
                  : "None"}
              </div>
            </div>

            <DialogFooter>
              <Button disabled={loading} type="submit">
                {loading ? 'በመመዝገብ ላይ...' : 'መዝግብ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
