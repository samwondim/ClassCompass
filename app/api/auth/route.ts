import prisma from "@/models/client";
import { encrypt, SESSION_DURATION } from "@/utils/session";
import { validateTelegramWebAppData } from "@/utils/telegramAuth";
import { Request } from "express";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { initData } = await request.json();

  const BOT_TOKEN = process.env.TELEGRAM_API_KEY;
  const validationRes = validateTelegramWebAppData(initData, BOT_TOKEN);

  if (validationRes.validatedData) {
    const user = { tg_username: validationRes.user.username };


    const expires = new Date(Date.now() + SESSION_DURATION);
    const session = await encrypt({ user, expires });


    const fetched_user = await prisma.user.findUnique({
      where: { tg_username: user.tg_username },
      select: { user_role: true }
    })

    if (!fetched_user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    cookies().set("session", session, { expires, httpOnly: true });
    return NextResponse.json({ user_role: fetched_user.user_role }, { status: 200 });
  } else {
    return NextResponse.json({ message: validationRes.message }, { status: 401 })
  }
}
