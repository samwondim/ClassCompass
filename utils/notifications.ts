import { Bot } from 'grammy';
import prisma from '@/lib/prisma';

const botToken = process.env.BOT_TOKEN || process.env.TELEGRAM_API_KEY;
const bot = botToken ? new Bot(botToken) : null;

const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Africa/Addis_Ababa';
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
  // Amharic action labels
  const actionLabels: Record<string, string> = {
    Added: 'ተጨምሯል',
    Removed: 'ተሰርዟል',
    Changed: 'ተቀይሯል',
    Reassigned: 'ተመድቧል',
  };
  const actionLabel = actionLabels[action] || action;

  console.log('🔔 notifyScheduleChange called:', {
    teacherUserId,
    teacherTgId,
    action,
    courseName,
    details
  });

  const title = `🗓 የመርሃ ግብር ለውጥ: ${actionLabel}`;
  const plainMessage = `ትምህርት: ${courseName}\n${details}`;

  await saveNotification(
    teacherUserId,
    title,
    plainMessage,
    action === 'Removed' ? 'warning' : 'info',
    '/teacher/my-schedules'
  );
  console.log('✅ Schedule change notification saved to database');

  const telegramTitle = `🗓 *የመርሃ ግብር ዝማኔ: ${escapeMarkdown(actionLabel)}*`;
  const body = `
${telegramTitle}

*ትምህርት:*
${escapeMarkdown(courseName)}

*ዝርዝር:*
${escapeMarkdown(details)}

*ጊዜ:*
${escapeMarkdown(new Date().toLocaleString('en-US', { timeZone: APP_TIMEZONE }))}
`;

  const deepLink = `[መርሃ ግብሬን ይመልከቱ](${WEB_APP_URL}?startapp=my_schedule)`;
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
    teacherName,
    reason,
    affectedClass,
    date
  });

  const title = '⚠️ መምህር አይገኝም';
  const plainMessage = `መምህር: ${teacherName}\nክፍል: ${affectedClass}\nቀን: ${date}\nምክንያት: ${reason}`;

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

  const telegramTitle = '⚠️ *መምህር አይገኝም*';
  const body = `
${telegramTitle}

*መምህር:*
${escapeMarkdown(teacherName)}

*ክፍል:*
${escapeMarkdown(affectedClass)}

*ቀን:*
${escapeMarkdown(date)}

*ምክንያት:*
${escapeMarkdown(reason)}
`;

  const deepLink = `[መርሃ ግብሮችን ያስተዳድሩ](${WEB_APP_URL}?startapp=manage_schedules)`;
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

/**
 * 4. Sunday schedule reminders → Teachers
 */
export async function notifySundayScheduleReminder(
  teacher: { user_id: string;   tg_id: string | null; first_name?: string | null; last_name?: string | null },
  schedules: Array<{
    schedule_date: Date
    course: { course_name: string | null; course_description: string | null }
    section: { section_name: string | null }
  }>,
  sundayDate: Date
) {
  if (!teacher.tg_id) return;

  const teacherName = `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'መምህር';
  const title = '📅 የሚቀጥለው እሁድ መርሃ ግብር';

  const lines = schedules.map((s) => {
    const course = s.course.course_name || s.course.course_description || 'ትምህርት';
    const section = s.section.section_name || 'ክፍል';
    const time = new Date(s.schedule_date).toLocaleTimeString('en-US', { timeZone: APP_TIMEZONE, hour: '2-digit', minute: '2-digit' });
    return `• ${course} (${section}) - ${time}`;
  });

  const plainMessage = `ሰላም ${teacherName},\nለሚቀጥለው እሁድ (${sundayDate.toLocaleDateString('en-US', { timeZone: APP_TIMEZONE })}) የሚከተሉ መርሃ ግብሮች አሉዎት:\n${lines.join('\n')}`;

  await saveNotification(
    teacher.user_id,
    title,
    plainMessage,
    'info',
    '/teacher/my-schedules'
  );

  const telegramTitle = '📅 *የእሁድ መርሃ ግብር ማስታወሻ*';
  const body = `
${telegramTitle}

*ቀን:*
${escapeMarkdown(sundayDate.toLocaleDateString('en-US', { timeZone: APP_TIMEZONE }))}

*መርሃ ግብሮች:*
${escapeMarkdown(lines.join('\n'))}
`;

  const deepLink = `[መርሃ ግብሬን ይመልከቱ](${WEB_APP_URL}?startapp=my_schedule)`;
  const fullMessage = `${body}\n${deepLink}`;
  await sendTelegramNotification(teacher.tg_id.toString(), fullMessage);
}

/**
 * 5. Missing schedule alerts → Managers
 */
export async function notifyMissingSundaySchedule(
  manager: { user_id: string;   tg_id: string | null; first_name?: string | null; last_name?: string | null },
  sectionName: string,
  sundayDate: Date
) {
  if (!manager.tg_id) return;

  const title = '⚠️ የእሁድ መርሃ ግብር አልተሞላም';
  const plainMessage = `ለ"${sectionName}" ክፍል ${sundayDate.toLocaleDateString('en-US', { timeZone: APP_TIMEZONE })} ቀን ምንም መርሃ ግብር አልተመዘገበም። እባክዎ መርሃ ግብር ይጨምሩ።`;

  await saveNotification(
    manager.user_id,
    title,
    plainMessage,
    'warning',
    '/manager/schedules'
  );

  const telegramTitle = '⚠️ *የእሁድ መርሃ ግብር አልተሞላም*';
  const body = `
${telegramTitle}

*ክፍል:*
${escapeMarkdown(sectionName)}

*ቀን:*
${escapeMarkdown(sundayDate.toLocaleDateString('en-US', { timeZone: APP_TIMEZONE }))}

*ምልክት:*
ለዚህ ክፍል ምንም መርሃ ግብር አልተመዘገበም\\. እባክዎ ይጨምሩ\\.
`;

  const deepLink = `[መርሃ ግብር ጨምር](${WEB_APP_URL}?startapp=manage_schedules)`;
  const fullMessage = `${body}\n${deepLink}`;
  await sendTelegramNotification(manager.tg_id.toString(), fullMessage);
}

/**
 * 7. Weekly empty schedule report → per-manager (only their own sections)
 */
export async function notifyWeeklyEmptyScheduleReport(
  managers: Array<{ user_id: string; tg_id: string | null; first_name?: string | null; last_name?: string | null; sections: string[] }>
) {
  for (const manager of managers) {
    if (!manager.tg_id) continue;
    if (!manager.sections || manager.sections.length === 0) continue;

    const title = '📋 የሳምንቱ የመርሃ ግብር ሪፖርት';
    const sectionsList = manager.sections.map(s => `• ${s}`).join('\n');
    const plainMessage = `ምንም መርሃ ግብር ያልተሞሉ ክፍሎች:\n${sectionsList}`;

    await saveNotification(
      manager.user_id,
      title,
      plainMessage,
      'warning',
      '/manager/schedules'
    );

    const telegramTitle = '📋 *የሳምንቱ የመርሃ ግብር ሪፖርት*';
    const body = `
${telegramTitle}

*ምንም መርሃ ግብር ያልተሞሉ ክፍሎች:*
${escapeMarkdown(sectionsList)}

*ትዕዛዝ:*
ለእነዚህ ክፍሎች መርሃ ግብር ይጨምሩ\\.
`;

    const deepLink = `[መርሃ ግብሮችን ይመልከቱ](${WEB_APP_URL}?startapp=manage_schedules)`;
    const fullMessage = `${body}\n${deepLink}`;
    await sendTelegramNotification(manager.tg_id.toString(), fullMessage);
  }
}
