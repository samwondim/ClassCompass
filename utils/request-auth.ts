import { NextRequest } from "next/server";
import prisma from "@/models/client";
import { validateTelegramWebAppData } from "@/utils/telegramAuth";
import { getSession } from "@/utils/session";

export async function getRequestUser(request: NextRequest) {
  const sessionUser = await getSession(request).then((session) => session?.fetched_user);
  if (sessionUser) return sessionUser;

  const initData = request.headers.get("x-telegram-init-data");
  if (!initData) return null;

  const botToken = process.env.TELEGRAM_API_KEY;
  if (!botToken) return null;

  const validation = validateTelegramWebAppData(initData, botToken);
  if (!validation.validatedData) return null;

  const tgUsername = validation.user.username;
  const tgId = validation.user.id ? Number(validation.user.id) : null;

  const or: Array<{ tg_username?: string; tg_id?: number }> = [];
  if (tgUsername) or.push({ tg_username: tgUsername });
  if (tgId) or.push({ tg_id: tgId });
  if (or.length === 0) return null;

  return prisma.user.findFirst({ where: { OR: or } });
}
