import { Bot } from 'grammy';
import prisma from '@/models/client';

const botToken = process.env.BOT_TOKEN;
const bot = botToken ? new Bot(botToken) : null;

const WEB_APP_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://t.me/class_compass_bot/app';

// Helper to escape MarkdownV2 special characters
function escapeMarkdown(text: string): string {
    return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
}

// Save notification to database
async function saveNotification(
    userId: string,
    title: string,
    message: string,
    type: string = 'info',
    link?: string
) {
    try {
        await prisma.notification.create({
            data: {
                user_id: userId,
                title,
                message,
                type,
                link,
            },
        });
    } catch (error) {
        console.error('Failed to save notification to database:', error);
    }
}

// Send Telegram notification
export async function sendTelegramNotification(telegramId: string, message: string) {
    if (!bot || !telegramId) {
        console.warn("Notification skipped: No bot token or invalid telegramId");
        return;
    }
    try {
        await bot.api.sendMessage(telegramId, message, { parse_mode: 'MarkdownV2' });
    } catch (error) {
        console.error(`Failed to send notification to ${telegramId}:`, error);
    }
}

/**
 * 1. Section-change notifications → Managers
 */
export async function notifySectionChange(
    managerUserId: string,
    managerTgId: string,
    sectionName: string,
    changerName: string,
    changeDetails: string
) {
    const title = "📢 Section Update";
    const plainMessage = `Section: ${sectionName}\nWhat Changed: ${changeDetails}\nBy: ${changerName}`;

    // Save to database
    await saveNotification(
        managerUserId,
        title,
        plainMessage,
        'info',
        '/manager/sections'
    );

    // Send Telegram message
    const telegramTitle = "📢 *Section Update*";
    const body = `
${telegramTitle}

*What Changed:*
${escapeMarkdown(changeDetails)}

*Triggered By:*
${escapeMarkdown(changerName)}

*Section:*
${escapeMarkdown(sectionName)}

*Time:*
${escapeMarkdown(new Date().toLocaleString())}
`;

    const deepLink = `[Open App](${WEB_APP_URL})`;
    const fullMessage = `${body}\n${deepLink}`;
    await sendTelegramNotification(managerTgId, fullMessage);
}

/**
 * 2. Schedule-change notifications → Teachers
 */
export async function notifyScheduleChange(
    teacherUserId: string,
    teacherTgId: string,
    action: 'Added' | 'Removed' | 'Changed' | 'Reassigned',
    courseName: string,
    changerName: string,
    details: string
) {
    const title = `🗓 Schedule Update: ${action}`;
    const plainMessage = `Course: ${courseName}\n${details}\nUpdated By: ${changerName}`;

    // Save to database
    await saveNotification(
        teacherUserId,
        title,
        plainMessage,
        action === 'Removed' ? 'warning' : 'info',
        '/teacher/my-schedules'
    );

    // Send Telegram message
    const telegramTitle = `🗓 *Schedule Update: ${action}*`;
    const body = `
${telegramTitle}

*Course:*
${escapeMarkdown(courseName)}

*Details:*
${escapeMarkdown(details)}

*Updated By:*
${escapeMarkdown(changerName)}

*Time:*
${escapeMarkdown(new Date().toLocaleString())}
`;

    const deepLink = `[Check Schedule](${WEB_APP_URL}?startapp=my_schedule)`;
    const fullMessage = `${body}\n${deepLink}`;
    await sendTelegramNotification(teacherTgId, fullMessage);
}

/**
 * 3. Teacher-unavailability notifications → Admin + Manager
 */
export async function notifyUnavailability(
    recipients: Array<{ userId: string; tgId: string }>,
    teacherName: string,
    reason: string,
    affectedClass: string,
    date: string
) {
    const title = "⚠️ Teacher Unavailability Report";
    const plainMessage = `Teacher: ${teacherName}\nClass: ${affectedClass}\nDate: ${date}\nReason: ${reason}`;

    // Save to database for all recipients
    await Promise.all(
        recipients.map(recipient =>
            saveNotification(
                recipient.userId,
                title,
                plainMessage,
                'warning',
                '/admin/schedules'
            )
        )
    );

    // Send Telegram messages
    const telegramTitle = "⚠️ *Teacher Unavailability Report*";
    const body = `
${telegramTitle}

*Teacher:*
${escapeMarkdown(teacherName)}

*Class Affected:*
${escapeMarkdown(affectedClass)}

*Date:*
${escapeMarkdown(date)}

*Reason:*
${escapeMarkdown(reason)}

*Time Reported:*
${escapeMarkdown(new Date().toLocaleString())}
`;

    const deepLink = `[Manage Substitutes](${WEB_APP_URL}?startapp=manage_schedules)`;
    const fullMessage = `${body}\n${deepLink}`;

    await Promise.all(recipients.map(r => sendTelegramNotification(r.tgId, fullMessage)));
}
