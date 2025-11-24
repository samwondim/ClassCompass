import prisma from "@/models/client";
import { jwtVerify, SignJWT } from "jose";
import { cookies, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

const key = new TextEncoder().encode(process.env.JWT_SECRET);

export const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

export async function encrypt(payload: any) {
  return await new SignJWT(payload).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime('1h').sign(key);
}

export async function decrypt(input: string) {
  const { payload } = await jwtVerify(input, key, { algorithms: ["HS256"] });

  return payload
}

export async function getSession() {
  const session = await cookies().get("session")?.value
  console.log("Session value in getSession", session)
  if (!session) return null
  return await decrypt(session)
}

export async function updateSession(request: NextRequest) {
  const session = await request.cookies.get("session")?.value
  if (!session) return

  const parsed = await decrypt(session)
  parsed.expires = new Date(Date.now() + SESSION_DURATION)
  const res = NextResponse.next()

  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    expires: parsed.expires
  });
}

export async function getUserRole() {

  const session = await getSession()

  const user = await prisma.user.findUnique({
    where: { tg_username: session.user.tg_username },
  })
  console.log("Inside getUserRole", user)

  return user;
}

export async function logout() {
  const cookieStore = await cookies();

  cookieStore.delete("session");
  redirect('/');
}
