import { Manager } from "@/app/models/models";
import { User } from "@/generated/prisma";
import prisma from "@/models/client";
import { NextRequest, NextResponse } from "next/server";
// select: { user_role: true, first_name: true, last_name: true, tg_username: true }
const toPublicManager = (userData: User): Manager => {
  return {
    user_role: userData.user_role,
    first_name: userData.first_name,
    last_name: userData.last_name,
    tg_username: userData.tg_username,
    sections_managed: userData.sections_managed
  }
}

export async function GET(request: NextRequest): Promise<Manager[]> {
  const res = await prisma.user.findMany({
    select: {
      user_role: true, first_name: true, last_name: true, tg_username: true, sections_managed: true
    }, where: {
      user_role: "MANAGER"
    }
  });

  const managers: Manager[] = res.map(toPublicManager);
  return NextResponse.json({ managers }, { status: 200 });
}
