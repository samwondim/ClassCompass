import prisma from "@/lib/prisma";
import { encrypt, SESSION_DURATION } from "@/utils/session";
import { validateTelegramWebAppData } from "@/utils/telegramAuth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

async function issueSession(fetched_user: any) {
  const expires = new Date(Date.now() + SESSION_DURATION);
  const session = await encrypt({ fetched_user, expires });

  const cookieStore = await cookies();
  cookieStore.set("session", session, { ...SESSION_COOKIE_OPTIONS, expires });

  return NextResponse.json({ session, user: { ...fetched_user } }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { initData, devLogin, tg_username: devUsername } = body;

    // --- Local development browser login (NOT available in production) ---
    const devLoginEnabled =
      process.env.NODE_ENV !== "production" &&
      (process.env.ALLOW_DEV_LOGIN === "true" || process.env.NEXT_PUBLIC_DEV_LOGIN === "true");

    if (devLogin && devLoginEnabled) {
      const tgUsername = devUsername?.replace(/^@/, '').trim();

      if (!tgUsername) {
        return NextResponse.json({ message: "Dev login requires a tg_username" }, { status: 400 });
      }

      const fetched_user = await prisma.user.findUnique({
        where: { tg_username: tgUsername },
        select: { user_role: true, first_name: true, last_name: true, tg_username: true, user_id: true, tg_id: true, photo_url: true }
      });

      if (!fetched_user) {
        return NextResponse.json({ message: "Dev user not found" }, { status: 404 });
      }

      return await issueSession(fetched_user);
    }

    const BOT_TOKEN = process.env.TELEGRAM_API_KEY;

    if (!BOT_TOKEN) {
      console.error('TELEGRAM_API_KEY environment variable is not set');
      return NextResponse.json({
        message: 'Server configuration error: Bot token not configured'
      }, { status: 500 });
    }

    const validationRes = validateTelegramWebAppData(initData, BOT_TOKEN);

    if (validationRes.validatedData) {
      const tgUsername = validationRes.user.username?.replace(/^@/, '').trim();
      const photo_url = validationRes.user.photo_url || null;

      if (!tgUsername) {
        return NextResponse.json({ message: "Telegram username is required" }, { status: 400 });
      }

      try {
        await prisma.user.update({
          where: {
            tg_username: tgUsername
          },
          data: {
            tg_id: validationRes.user.id ? String(validationRes.user.id) : null,
            photo_url: photo_url
          }
        });
      } catch (err: any) {
        if (err.code === 'P2025') { // Record to update not found.
          return NextResponse.json({ message: "User not found in the system. Please ask an admin to add you." }, { status: 404 });
        }
        throw err;
      }

      const fetched_user = await prisma.user.findUnique({
        where: { tg_username: tgUsername },
        select: { user_role: true, first_name: true, last_name: true, tg_username: true, user_id: true, tg_id: true, photo_url: true }
      })

      if (fetched_user) {
        return await issueSession(fetched_user);
      } else {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }

    } else {
      return NextResponse.json({ message: validationRes.message }, { status: 401 })
    }
  } catch (error: any) {
    console.log("AUTH ERROR", error)
    return NextResponse.json({ message: error.message || "Internal server error", error }, { status: 500 })

  }
}
