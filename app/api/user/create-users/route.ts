import { PrismaClient } from '@/generated/prisma'
import prisma from '@/models/client';
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {

    const users = await request.json();

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      await prisma.user.create({
        data: {
          tg_username: user.tg_username,
          user_role: user.user_role,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
        }
      });
    }

    return NextResponse.json({ message: 'Users created!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
