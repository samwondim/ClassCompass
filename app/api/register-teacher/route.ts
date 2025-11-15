import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(req: NextRequest) {
  try {
    const { telegram_id, phone_number, first_name, last_name, is_manager, is_class_rep } = await req.json()

    if (!telegram_id || !phone_number || !first_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const existingTeacher = await prisma.teacher.findUnique({
      where: { telegram_id: BigInt(telegram_id) }
    })

    if (existingTeacher) {
      return NextResponse.json({ error: 'Teacher with this Telegram ID already exists' }, { status: 409 })
    }

    const newTeacher = await prisma.teacher.create({
      data: {
        first_name,
        last_name: last_name || null,
        phone_number,
        telegram_id: BigInt(telegram_id),
        is_manager: is_manager || false,
        is_class_rep: is_class_rep || false,
      },
    })

    return NextResponse.json({ message: 'Teacher registered successfully', teacher: newTeacher }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
