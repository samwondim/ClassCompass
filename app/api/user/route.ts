import { PrismaClient, User } from '@/generated/prisma'
import prisma from '@/models/client';
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {

    const userData = await request.json();

    const user = await prisma.user.create({
      data: {
        tg_username: userData.tg_username,
        user_role: userData.user_role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
      }
    });

    if (userData.sectionIds && Array.isArray(userData.sectionIds) && userData.sectionIds.length > 0) {
      await prisma.managerSection.createMany({
        data: userData.sectionIds.map((sectionId: string) => ({
          manager_id: user.user_id,
          section_id: sectionId
        }))
      });
    }

    return NextResponse.json({ message: 'User created!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {

    const query = request.nextUrl.searchParams.get('user_role');
    let users: User[] = [];
    let filtered_users: User[] = [];

    if (query) {
      filtered_users = (await prisma.user.findMany()).filter(user => user.user_role === query);
    } else {
      users = (await prisma.user.findMany());
    }

    return NextResponse.json({ users: users.concat(filtered_users) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No data provided for update' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { user_id: id },
      data: body,
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user:', error);

    return NextResponse.json(
      { error: 'Failed to update user', details: error.message },
      { status: 500 }
    );
  }
}

