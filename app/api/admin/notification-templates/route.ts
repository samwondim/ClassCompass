import { NextResponse } from 'next/server';
import prisma from '@/models/client';

export async function GET() {
  const templates = await prisma.notificationTemplate.findMany();
  return NextResponse.json({ templates });
}

export async function PUT(request: Request) {
  const { key, message } = await request.json();
  const template = await prisma.notificationTemplate.upsert({
    where: { key },
    update: { message },
    create: { key, message },
  });
  return NextResponse.json({ template });
}
