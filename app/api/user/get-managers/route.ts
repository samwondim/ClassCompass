import prisma from "@/models/client";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

import { Manager } from "@/app/models/models";
import { User } from "@/generated/prisma";

// Map Prisma user → Manager DTO
const toPublicManager = (user: any): Manager => {
  return {
    user_role: user.user_role,
    user_id: user.user_id,
    telegram_id: user.tg_id,
    first_name: user.first_name,
    last_name: user.last_name,
    tg_username: user.tg_username,
    phone_number: user.phone_number,
    sections: user.sections_managed
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
        user_id: true,
        first_name: true,
        last_name: true,
        tg_username: true,
        phone_number: true,
        sections_managed: {
          select: {
            section_name: true,
            section_id: true
          }
        },
        ManagerSection: {
          select: {
            section: {
              select: {
                section_name: true,
                section_id: true
              }
            }
          }
        }
      }
    });

    const managers = users.map(user => ({
      ...toPublicManager(user),
      sections: [
        ...user.sections_managed,
        ...user.ManagerSection.map(ms => ms.section)
      ]
    }));
    return NextResponse.json({ managers });

  } catch (error) {
    console.error("MANAGERS API ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch managers" },
      { status: 500 }
    );
  }
}
