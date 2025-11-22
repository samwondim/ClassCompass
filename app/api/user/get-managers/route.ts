import prisma from "@/models/client";
import { NextRequest, NextResponse } from "next/server";
import { Manager } from "@/app/models/models";
import { User } from "@/generated/prisma";

// Map Prisma user → Manager DTO
const toPublicManager = (user: User): Manager => {
  let sections = "";

  for (let i = 0; i < user.sections_managed.length; i++) {
    sections += user.sections_managed[i].section_name + ", ";
  }
  return {
    user_role: user.user_role,
    first_name: user.first_name,
    last_name: user.last_name,
    tg_username: user.tg_username,
    sections: sections
  }
};

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      where: {
        user_role: "MANAGER"
      },
      select: {
        user_role: true,
        first_name: true,
        last_name: true,
        tg_username: true,
        sections_managed: {
          select: {
            section_name: true
          }
        }
      }
    });

    const managers = users.map(toPublicManager);
    return NextResponse.json({ managers });

  } catch (error) {
    console.error("MANAGERS API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch managers" },
      { status: 500 }
    );
  }
}
