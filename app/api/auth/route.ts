import prisma from "@/prisma/client";
import { encrypt, SESSION_DURATION } from "@/utils/session";
import { validateTelegramWebAppData } from "@/utils/telegramAuth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();
    // const { initData } = {
    //   "initData":
    //     "user=%7B%22id%22%3A1845537164%2C%22first_name%22%3A%22Sam%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22triviosa%22%2C%22language_code%22%3A%22en%22%2C%22allows_write_to_pm%22%3Atrue%2C%22photo_url%22%3A%22https%3A%5C%2F%5C%2Ft.me%5C%2Fi%5C%2Fuserpic%5C%2F320%5C%2FaMUFOe5cu11VbYZNpOC5ziSHBZLfje2U2B-RjvbGd4M.svg%22%7D&chat_instance=-7201700833685701877&chat_type=private&auth_date=1764497960&signature=lL-1KJ1dZVUXcpJEz6n637gA4M1offvHTjE0U8mvBeW-2cdCbEC9d7vlAS3agt4eTNM7XYddvBNtb5spitk2CA&hash=e2fc4177ede877442d64eb168b0cc01bd3c5e46fb073c4df6ca566e9d8ced6e6"
    // };

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
      const photo_url = validationRes.user.photo_url || null;

      await prisma.user.update({
        where: {
          tg_username: user.tg_username
        },
        data: {
          tg_id: validationRes.user.id ? +validationRes.user.id : null,
          photo_url: photo_url
        }
      });
      const fetched_user = await prisma.user.findUnique({
        where: { tg_username: user.tg_username },
        select: { user_role: true, first_name: true, last_name: true, tg_username: true, user_id: true, tg_id: true, photo_url: true }
      })

      const expires = new Date(Date.now() + SESSION_DURATION);
      if (fetched_user) {
        console.log("FETCHED USER", fetched_user)
        console.log(" EXPIRES", expires)

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
  } catch (error) {
    console.log("AUTH ERROR", error)
    return NextResponse.json({ error })

  }
}
