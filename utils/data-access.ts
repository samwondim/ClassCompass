import prisma from "@/models/client";
import { getSession } from "./session";

export async function getUserRole() {

    const session = await getSession()

    if (!session || !session.fetched_user) return null;

    const userId = session.fetched_user.user_id;
    const user = await prisma.user.findUnique({
        where: { user_id: userId },
    }) || (session.fetched_user.tg_username
        ? await prisma.user.findUnique({
            where: { tg_username: session.fetched_user.tg_username },
        })
        : null);
    console.log("Inside getUserRole", user)

    return user;
}
