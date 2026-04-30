

"use client";

import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function EditManagerForm({ manager, onClose }: any) {
  const [firstName, setFirstName] = useState(manager.first_name);
  const [lastName, setLastName] = useState(manager.last_name);
  const [tg_username, setTgUsername] = useState(manager.tg_username);
  const [phone_number, setPhoneNumber] = useState(manager.phone_number);
  
  const [sections, setSections] = useState<Array<{ section_id: string; section_name: string }>>([]);
  const [selectedSections, setSelectedSections] = useState<string[]>(
    manager.sections?.map((s: any) => s.section_id) || []
  );

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch('/api/sections');
        const data = await res.json();
        setSections(data.sections || []);
      } catch (error) {
        console.error(error);
        setSections([]);
      }
    };
    fetchSections();
  }, []);

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSectionChange = (value: string) => {
    toggleSection(value);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch(`/api/user/${manager.user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone_number,
        tg_username: tg_username,
        sectionIds: selectedSections
      })
    });

    if (res.ok) {
      onClose();       // close modal
      window.location.reload(); // refresh table
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 w-full">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">First Name</label>
        <input
          className="border p-2 w-full rounded"
          value={firstName}
          onChange={e => setFirstName(e.target.value)}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Last Name</label>
        <input
          className="border p-2 w-full rounded"
          value={lastName}
          onChange={e => setLastName(e.target.value)}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Phone Number</label>
        <input
          className="border p-2 w-full rounded"
          value={phone_number}
          onChange={e => setPhoneNumber(e.target.value)}
        />
      </div>
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">Telegram Username</label>
        <input
          className="border p-2 w-full rounded"
          value={tg_username}
          onChange={e => setTgUsername(e.target.value)}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium">ሚያስተዳድረው ክፍል</label>
        <Select onValueChange={handleSectionChange}>
          <SelectTrigger className="mt-2 border p-2 w-full rounded text-left">
            <SelectValue placeholder="ክፍል ይምረጡ" />
          </SelectTrigger>
          <SelectContent>
            {sections.map((sec) => (
              <SelectItem key={sec.section_id} value={sec.section_id}>
                <span className={selectedSections.includes(sec.section_id) ? 'font-semibold' : ''}>
                  {sec.section_name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 text-sm text-gray-500">Selected: {selectedSections.length > 0 ? selectedSections.length : 'None'}</div>
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}
