import { NextRequest, NextResponse } from 'next/server'
import { validateTelegramWebAppData } from '@/lib/telegram-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function authenticateRequest(request: NextRequest) {
  const initData = request.headers.get('x-telegram-init-data')
  
  if (!initData) {
    return null
  }

  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    return null
  }

  const validatedData = validateTelegramWebAppData(initData, botToken)
  if (!validatedData || !validatedData.user) {
    return null
  }

  const teacher = await prisma.teacher.findUnique({
    where: { telegram_id: BigInt(validatedData.user.id) }
  })

  return teacher
}

// GET /api/schedules/check - Check for duplicate schedules
export async function GET(request: NextRequest) {
  try {
    const teacher = await authenticateRequest(request)
    
    if (!teacher || !teacher.is_manager) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const date = searchParams.get('date')

    if (!teacherId || !date) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Check if there's already a schedule for this teacher at this time
    // Allow some buffer (30 minutes before/after) to prevent overlapping schedules
    const scheduleDate = new Date(date)
    const bufferStart = new Date(scheduleDate.getTime() - 30 * 60000) // 30 minutes before
    const bufferEnd = new Date(scheduleDate.getTime() + 30 * 60000)   // 30 minutes after

    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        teacher_id: parseInt(teacherId),
        date: {
          gte: bufferStart,
          lte: bufferEnd
        }
      }
    })

    return NextResponse.json({ 
      exists: !!existingSchedule,
      conflictingSchedule: existingSchedule ? {
        id: existingSchedule.id,
        date: existingSchedule.date
      } : null
    })
  } catch (error) {
    console.error('Check schedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
