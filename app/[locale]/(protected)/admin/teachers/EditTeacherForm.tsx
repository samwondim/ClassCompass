
"use client";

import { useState } from "react";

export default function EditTeacherForm({ teacher, onClose }: any) {
  const [firstName, setFirstName] = useState(teacher.first_name);
  const [lastName, setLastName] = useState(teacher.last_name);
  const [tg_username, setTgUsername] = useState(teacher.tg_username);
  const [phone_number, setPhoneNumber] = useState(teacher.phone_number);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const res = await fetch(`/api/user/${teacher.user_id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        phone_number: phone_number,
        tg_username: tg_username
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
      <button className="bg-blue-600 text-white px-4 py-2 rounded">
        Save
      </button>
    </form>
  );
}
