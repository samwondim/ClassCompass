import { PrismaClient, User } from '@/generated/prisma'
import prisma from '@/models/client';
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {

    const userData = await request.json();

    await prisma.user.create({
      data: {
        tg_username: userData.tg_username,
        user_role: userData.user_role,
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
      }
    });

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
