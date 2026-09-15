import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from '@/utils/data-access';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (user.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized: Only admins can create users' }, { status: 403 });
    }

    const users = await request.json();

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ error: 'Expected a non-empty array of users' }, { status: 400 });
    }

    const data = users.map((u: any) => ({
      tg_username: u.tg_username?.replace(/^@/, '').trim(),
      user_role: u.user_role,
      first_name: u.first_name,
      last_name: u.last_name,
      phone_number: u.phone_number,
    }));

    await prisma.user.createMany({ data });

    return NextResponse.json({ message: 'Users created!' }, { status: 201 });
  } catch (error) {
    console.error('Error creating users:', error);
    return NextResponse.json({ error: 'Failed to create users' }, { status: 500 });
  }
}
