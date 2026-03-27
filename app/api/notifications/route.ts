import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/models/client';
import { getSession } from '@/utils/session';

export const dynamic = 'force-dynamic';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
    try {
        const user = await getSession(request).then(s => s?.fetched_user);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { user_id: user.user_id },
            orderBy: { created_at: 'desc' },
            take: 50, // Limit to 50 most recent
        });

        return NextResponse.json({ notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH /api/notifications - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
    try {
        const user = await getSession(request).then(s => s?.fetched_user);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationIds } = await request.json();

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({ error: 'Invalid notification IDs' }, { status: 400 });
        }

        await prisma.notification.updateMany({
            where: {
                id: { in: notificationIds },
                user_id: user.user_id, // Ensure user owns these notifications
            },
            data: { is_read: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Mark notifications as read error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE /api/notifications - Delete notification(s)
export async function DELETE(request: NextRequest) {
    try {
        const user = await getSession(request).then(s => s?.fetched_user);

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { notificationIds } = await request.json();

        if (!notificationIds || !Array.isArray(notificationIds)) {
            return NextResponse.json({ error: 'Invalid notification IDs' }, { status: 400 });
        }

        await prisma.notification.deleteMany({
            where: {
                id: { in: notificationIds },
                user_id: user.user_id,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete notifications error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
