import prisma from '@/models/client';
import { NextRequest, NextResponse } from "next/server";
import { getUserRole } from '@/utils/data-access';


export async function POST(request: NextRequest) {
  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (user.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userData = await request.json();

    const newUser = await prisma.user.create({
      data: {
        tg_username: userData.tg_username?.replace(/^@/, '').trim(),
        user_role: userData.user_role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
      }
    });

    if (userData.user_role === 'MANAGER' && userData.sectionIds?.length > 0) {
      await prisma.managerSection.createMany({
        data: userData.sectionIds.map((sectionId: string) => ({
          manager_id: newUser.user_id,
          section_id: sectionId,
        })),
      });
    }

    return NextResponse.json({ message: 'User created!' }, { status: 200 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserRole(request);

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (user.user_role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const query = request.nextUrl.searchParams.get('user_role');
    let users = [];

    if (query) {
      users = await prisma.user.findMany({ where: { user_role: query as any } });
    } else {
      users = (await prisma.user.findMany());
    }

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
