import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getRequestUser } from '@/utils/request-auth';
import { notifyUnavailability } from '@/utils/notifications';

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (user.user_role !== 'TEACHER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { date, reason } = await request.json();
    if (!date || !reason) {
      return NextResponse.json({ error: 'Date and reason are required' }, { status: 400 });
    }

    // Find the teacher's sections
    const teacherSections = await prisma.teacherSection.findMany({
      where: { teacher_id: user.user_id },
      include: {
        section: {
          include: {
            manager: { select: { user_id: true, tg_id: true } },
            ManagerSection: {
              include: { manager: { select: { user_id: true, tg_id: true } } },
            },
          },
        },
      },
    });

    // Collect admins + managers of the teacher's sections as recipients
    const recipients = new Map<string, { userId: string; tgId: string }>();

    const admins = await prisma.user.findMany({
      where: { user_role: 'ADMIN' },
      select: { user_id: true, tg_id: true },
    });
    for (const admin of admins) {
      if (admin.tg_id) recipients.set(admin.user_id, { userId: admin.user_id, tgId: admin.tg_id });
    }

    for (const ts of teacherSections) {
      if (ts.section.manager?.tg_id) {
        recipients.set(ts.section.manager.user_id, { userId: ts.section.manager.user_id, tgId: ts.section.manager.tg_id });
      }
      for (const ms of ts.section.ManagerSection) {
        if (ms.manager.tg_id) {
          recipients.set(ms.manager.user_id, { userId: ms.manager.user_id, tgId: ms.manager.tg_id });
        }
      }
    }

    const recipientList = Array.from(recipients.values());

    if (recipientList.length === 0) {
      return NextResponse.json({ message: 'No recipients to notify' }, { status: 200 });
    }

    const teacherName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'መምህር';
    const affectedClasses = teacherSections.map(ts => ts.section.section_name).join(', ') || '—';

    await notifyUnavailability(recipientList, teacherName, reason, affectedClasses, date);

    return NextResponse.json({ message: 'Unavailability reported successfully' }, { status: 200 });
  } catch (error) {
    console.error('Unavailability submission error:', error);
    return NextResponse.json({ error: 'Failed to submit unavailability' }, { status: 500 });
  }
}
