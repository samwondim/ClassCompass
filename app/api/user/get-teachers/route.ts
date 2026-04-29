
import { Teacher } from "@/app/models/models";
import { User } from "@/generated/prisma";
import prisma from "@/models/client";
import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/utils/data-access";

export const dynamic = 'force-dynamic';


const toPublicTeacher = (userData: any): Teacher => {
  let sections = "";
  if (userData.teacher_sections) {
    for (let i = 0; i < userData.teacher_sections.length; i++) {
      sections += userData.teacher_sections[i].section.section_name + ", ";
    }
  }

  return {
    user_id: userData.user_id,
    user_role: userData.user_role as any,
    first_name: userData.first_name,
    last_name: userData.last_name,
    tg_username: userData.tg_username,
    phone_number: userData.phone_number,
    photo_url: userData.photo_url,
    sections: sections
  }
}

export async function GET(request: NextRequest) {
  const user = await getUserRole(request);
  let sectionIds: string[] = [];

  if (user?.user_role === 'MANAGER') {
    const [managerSections, directSections] = await Promise.all([
      prisma.managerSection.findMany({
        where: { manager_id: user.user_id },
        select: { section_id: true },
      }),
      prisma.section.findMany({
        where: { manager_id: user.user_id },
        select: { section_id: true },
      }),
    ]);

    sectionIds = [
      ...managerSections.map(ms => ms.section_id),
      ...directSections.map(s => s.section_id),
    ];
  }

  const whereClause: any = {
    user_role: { in: ["TEACHER", "MANAGER", "ADMIN"] }
  };

  if (sectionIds.length > 0) {
    whereClause.teacher_sections = {
      some: {
        section_id: { in: sectionIds }
      }
    };
  }

  const res = await prisma.user.findMany({
    where: whereClause,
    select: {
      user_id: true,
      user_role: true,
      first_name: true,
      last_name: true,
      tg_username: true,
      photo_url: true,
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
  return NextResponse.json({ teachers }, { status: 200 });
}
