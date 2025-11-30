import prisma from "@/prisma/client";
import { encrypt, SESSION_DURATION } from "@/utils/session";
import { validateTelegramWebAppData } from "@/utils/telegramAuth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { initData } = await request.json();

  const BOT_TOKEN = process.env.TELEGRAM_API_KEY;

  if (!BOT_TOKEN) {
    console.error('TELEGRAM_API_KEY environment variable is not set');
    return NextResponse.json({
      message: 'Server configuration error: Bot token not configured'
    }, { status: 500 });
  }

  const validationRes = validateTelegramWebAppData(initData, BOT_TOKEN);

  if (validationRes.validatedData) {
    const user = { tg_username: validationRes.user.username };

    await prisma.user.update({
      where: {
        tg_username: user.tg_username
      },
      data: {
        tg_id: validationRes.user.id ? +validationRes.user.id : null
      }
    });
    const fetched_user = await prisma.user.findUnique({
      where: { tg_username: user.tg_username },
      select: { user_role: true, first_name: true, last_name: true, tg_username: true, user_id: true, tg_id: true }
    })

    const expires = new Date(Date.now() + SESSION_DURATION);
    if (fetched_user) {

      const session = await encrypt({ fetched_user, expires });

      const cookieStore = await cookies();
      cookieStore.set("session", session, { expires, httpOnly: true });
      return NextResponse.json({ session, user: { ...fetched_user } }, { status: 200 });
    } else {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }


  } else {
    return NextResponse.json({ message: validationRes.message }, { status: 401 })
  }
}
