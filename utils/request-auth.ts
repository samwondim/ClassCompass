import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { validateTelegramWebAppData } from "@/utils/telegramAuth";
import { getSession } from "@/utils/session";

export async function getRequestUser(request: NextRequest) {
  const session = await getSession(request);
  const sessionUser = session?.fetched_user;

  if (sessionUser?.user_id) {
    // Re-validate against the database so a stale/demoted role in the JWT
    // cannot grant privileges after the user has been changed or removed.
    const freshUser = await prisma.user.findUnique({
      where: { user_id: sessionUser.user_id },
      select: {
        user_id: true,
        user_role: true,
        first_name: true,
        last_name: true,
        tg_username: true,
        tg_id: true,
        photo_url: true,
        phone_number: true,
      },
    });
    if (freshUser) return freshUser;
    return null;
  }

  const initData = request.headers.get("x-telegram-init-data");
  if (!initData) return null;

  const botToken = process.env.TELEGRAM_API_KEY;
  if (!botToken) return null;

  const validation = validateTelegramWebAppData(initData, botToken);
  if (!validation.validatedData) return null;

  const tgUsername = validation.user.username;
  const tgId = validation.user.id ? String(validation.user.id) : null;

  const or: Array<{ tg_username?: string; tg_id?: string }> = [];
  if (tgUsername) or.push({ tg_username: tgUsername });
  if (tgId) or.push({ tg_id: tgId });
  if (or.length === 0) return null;

  return prisma.user.findFirst({ where: { OR: or } });
}
