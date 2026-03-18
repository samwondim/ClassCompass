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
  // Validate bot initialization
  if (!botToken) {
    console.error('❌ TELEGRAM BOT ERROR: BOT_TOKEN environment variable is not set');
    return false;
  }

  if (!bot) {
    console.error('❌ TELEGRAM BOT ERROR: Bot instance failed to initialize');
    return false;
  }

  // Validate telegram ID
  if (!telegramId || telegramId === 'null' || telegramId === 'undefined') {
    console.error('❌ TELEGRAM BOT ERROR: Invalid telegramId provided:', telegramId);
    return false;
  }

  try {
    console.log(`📤 Attempting to send Telegram message to chat ID: ${telegramId}`);
    console.log(`📝 Message preview: ${message.substring(0, 100)}...`);

    const result = await bot.api.sendMessage(telegramId, message, { parse_mode: 'MarkdownV2' });

    console.log(`✅ Telegram message sent successfully to ${telegramId}. Message ID: ${result.message_id}`);
    return true;
  } catch (error: any) {
    console.error(`❌ TELEGRAM BOT ERROR: Failed to send message to ${telegramId}`);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      description: error.description,
      code: error.error_code,
      parameters: error.parameters
    });

    // Log specific common errors
    if (error.error_code === 400) {
      console.error('⚠️  Bad Request - Check message formatting or chat ID validity');
    } else if (error.error_code === 403) {
      console.error('⚠️  Forbidden - User may have blocked the bot or chat doesn\'t exist');
    } else if (error.error_code === 429) {
      console.error('⚠️  Rate Limited - Too many requests');
    }

    return false;
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
  console.log('🔔 notifySectionChange called:', {
    managerUserId,
    managerTgId,
    sectionName,
    changerName,
    changeDetails
  });

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
  console.log('✅ Section change notification saved to database');

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

  const sent = await sendTelegramNotification(managerTgId, fullMessage);
  if (sent) {
    console.log('✅ Section change Telegram notification sent successfully');
  } else {
    console.error('❌ Section change Telegram notification failed');
  }
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
  console.log('🔔 notifyScheduleChange called:', {
    teacherUserId,
    teacherTgId,
    action,
    courseName,
    changerName,
    details
  });

  const title = `🗓 የመርሃ ግብር ለውጥ: ${action}`;
  const plainMessage = `ትምህር: ${courseName}\n${details}\n`;

  // Save to database
  await saveNotification(
    teacherUserId,
    title,
    plainMessage,
    action === 'Removed' ? 'warning' : 'info',
    '/teacher/my-schedules'
  );
  console.log('✅ Schedule change notification saved to database');

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

  const sent = await sendTelegramNotification(teacherTgId, fullMessage);
  if (sent) {
    console.log('✅ Schedule change Telegram notification sent successfully');
  } else {
    console.error('❌ Schedule change Telegram notification failed');
  }
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
  console.log('🔔 notifyUnavailability called:', {
    recipientCount: recipients.length,
    recipients: recipients.map(r => ({ userId: r.userId, tgId: r.tgId })),
    teacherName,
    reason,
    affectedClass,
    date
  });

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
  console.log(`✅ Unavailability notifications saved to database for ${recipients.length} recipients`);

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

  const results = await Promise.all(
    recipients.map(async (r) => {
      const sent = await sendTelegramNotification(r.tgId, fullMessage);
      return { tgId: r.tgId, sent };
    })
  );

  const successCount = results.filter(r => r.sent).length;
  const failCount = results.filter(r => !r.sent).length;

  console.log(`✅ Unavailability Telegram notifications: ${successCount} sent, ${failCount} failed`);
  if (failCount > 0) {
    console.error('❌ Failed recipients:', results.filter(r => !r.sent).map(r => r.tgId));
  }
}
