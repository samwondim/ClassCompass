
import { Teacher } from "@/app/models/models";
import { User } from "@/generated/prisma";
import prisma from "@/models/client";
import { NextRequest, NextResponse } from "next/server";

const toPublicTeacher = (userData: User): Teacher => {
  return {
    user_role: userData.user_role,
    first_name: userData.first_name,
    last_name: userData.last_name,
    tg_username: userData.tg_username,
    teacher_sections: userData.teacher_sections
  }
}

export async function GET(request: NextRequest): Promise<Teacher[]> {
  const res = await prisma.user.findMany({
    select: {
      user_role: true, first_name: true, last_name: true, tg_username: true, teacher_sections: true
    }, where: {
      user_role: "TEACHER"
    }
  });

  const teachers: Teacher[] = res.map(toPublicTeacher);
  return NextResponse.json({ teachers }, { status: 200 });
}
