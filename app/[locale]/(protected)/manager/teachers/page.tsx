
// app/manager/page.tsx (or your file)
import { Manager, Teacher } from "@/app/models/models";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { AddTeacherButton } from "@/components/add-teacher-button";

import prisma from "@/models/client";

const toPublicTeacher = (userData: any): Teacher => {
  let sections = "";
  if (userData.teacher_sections) {
    for (let i = 0; i < userData.teacher_sections.length; i++) {
      sections += userData.teacher_sections[i].section.section_name + ", ";
    }
  }

  return {
    user_id: userData.user_id,
    user_role: userData.user_role,
    first_name: userData.first_name,
    last_name: userData.last_name,
    tg_username: userData.tg_username,
    phone_number: userData.phone_number,
    sections: sections
  }
}

async function getData(): Promise<Teacher[]> {
  try {
    const res = await prisma.user.findMany({
      where: {
        user_role: "TEACHER"
      },
      select: {
        user_id: true,
        user_role: true,
        first_name: true,
        last_name: true,
        tg_username: true,
        phone_number: true,
        teacher_sections: {
          select: {
            section: {
              select: {
                section_name: true
              }
            }
          }
        }
      }
    });

    const teachers: Teacher[] = res.map(toPublicTeacher);
    return teachers;
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return [];
  }
}

export default async function TeacherMgmtPage() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Teachers</h1>
        <AddTeacherButton />
      </div>
      {data.length === 0 ? (
        <p className="text-muted-foreground">No teachers found.</p>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
}
