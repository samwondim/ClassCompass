import prisma from "@/models/client";
import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from "@/utils/data-access";

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
    photo_url: user.photo_url,
    phone_number: user.phone_number,
    sections: user.sections_managed
  }
};

export async function GET(request: NextRequest) {
  try {
    const user = await getUserRole(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.user_role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const searchParams = request.nextUrl.searchParams;
    const requestedSectionId = searchParams.get('section_id');

    const whereClause: any = {
      user_role: "MANAGER"
    };

    if (requestedSectionId && requestedSectionId !== 'all') {
      whereClause.OR = [
        { sections_managed: { some: { section_id: requestedSectionId } } },
        { ManagerSection: { some: { section_id: requestedSectionId } } }
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        user_role: true,
        user_id: true,
        first_name: true,
        last_name: true,
        tg_username: true,
        photo_url: true,
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

    const managers = users.map(u => ({
      ...toPublicManager(u),
      sections: [
        ...u.sections_managed,
        ...u.ManagerSection.map((ms: any) => ms.section)
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
