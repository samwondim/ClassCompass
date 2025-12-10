import prisma from "@/models/client";
import { getSession } from "./session";

export async function getUserRole() {

    const session = await getSession()

    if (!session || !session.fetched_user) return null;

    const user = await prisma.user.findUnique({
        where: { tg_username: session.fetched_user.tg_username },
    })
    console.log("Inside getUserRole", user)

    return user;
}
