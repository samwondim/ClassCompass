
import { Teacher } from "@/app/models/models";
import { User } from "@/generated/prisma";
import prisma from "@/models/client";
import { NextRequest, NextResponse } from "next/server";

const toPublicTeacher = (userData: User): Teacher => {
  let sections = "";
  for (let i = 0; i < userData.teacher_sections.length; i++) {
    sections += userData.teacher_sections[i].section.section_name + ", ";
  }

  return {
    user_id: userData.user_id,
    user_role: userData.user_role,
    first_name: userData.first_name,
    last_name: userData.last_name,
    tg_username: userData.tg_username,
    sections: sections
  }

}

export async function GET(request: NextRequest): Promise<Teacher[]> {
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
  return NextResponse.json({ teachers }, { status: 200 });
}
