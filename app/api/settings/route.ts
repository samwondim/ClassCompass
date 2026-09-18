import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getRequestUser } from '@/utils/request-auth';
import { ok, badRequest, unauthorized, forbidden, serverError } from '@/utils/response';

// Singleton row: the app has exactly one settings record, keyed by this fixed id.
const SETTINGS_ID = 'app';

// Readable by anyone (including the pre-login splash screen), editable by admins only.
export async function GET() {
  try {
    const settings = await prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {},
      create: { id: SETTINGS_ID },
    });
    return ok({ settings });
  } catch (error) {
    console.error('Get app settings error:', error);
    return serverError('Failed to fetch settings');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getRequestUser(request);
    if (!currentUser) return unauthorized();
    if (currentUser.user_role !== 'ADMIN') return forbidden();

    const body = await request.json();
    const appName = typeof body.app_name === 'string' ? body.app_name.trim() : '';
    const botDescription = typeof body.bot_description === 'string' ? body.bot_description.trim() : '';
    const botShortDescription = typeof body.bot_short_description === 'string' ? body.bot_short_description.trim() : '';

    if (!appName) return badRequest('App name is required');
    if (appName.length > 64) return badRequest('App name must be 64 characters or fewer');
    if (botShortDescription.length > 120) return badRequest('Short description must be 120 characters or fewer');
    if (botDescription.length > 512) return badRequest('Description must be 512 characters or fewer');

    const settings = await prisma.appSettings.upsert({
      where: { id: SETTINGS_ID },
      update: {
        app_name: appName,
        bot_description: botDescription || null,
        bot_short_description: botShortDescription || null,
        updated_by: currentUser.user_id,
      },
      create: {
        id: SETTINGS_ID,
        app_name: appName,
        bot_description: botDescription || null,
        bot_short_description: botShortDescription || null,
        updated_by: currentUser.user_id,
      },
    });

    // Best-effort: push the same details to Telegram so the bot's own profile
    // (BotFather name/description) matches what's configured here. A failure
    // here (bad token, rate limit, etc.) shouldn't block saving locally.
    const botToken = process.env.TELEGRAM_API_KEY || process.env.BOT_TOKEN;
    if (botToken) {
      try {
        const { Bot } = await import('grammy');
        const bot = new Bot(botToken);
        await Promise.all([
          bot.api.setMyName(appName),
          bot.api.setMyDescription(botDescription || ''),
          bot.api.setMyShortDescription(botShortDescription || ''),
        ]);
      } catch (telegramError) {
        console.error('Failed to sync bot profile with Telegram:', telegramError);
      }
    }

    return ok({ settings });
  } catch (error) {
    console.error('Update app settings error:', error);
    return serverError('Failed to update settings');
  }
}
