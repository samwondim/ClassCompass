import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

let _key: Uint8Array | null = null;

function getKey(): Uint8Array {
  if (_key) return _key;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is not configured or is too short (must be at least 32 characters). Set it in your environment."
    );
  }
  _key = new TextEncoder().encode(secret);
  return _key;
}

export const SESSION_DURATION = 60 * 60 * 1000; // 1 hour

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getKey());
}

export async function decrypt(input: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(input, getKey(), { algorithms: ["HS256"] });
    return payload;
  } catch {
    return null;
  }
}

export async function getSession(request?: NextRequest) {
  const cookieStore = request ? request.cookies : await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  return await decrypt(session);
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get("session")?.value;
  if (!session) return;

  const parsed = await decrypt(session);
  if (!parsed) return;

  parsed.expires = new Date(Date.now() + SESSION_DURATION);
  const res = NextResponse.next();

  res.cookies.set({
    name: "session",
    value: await encrypt(parsed),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: parsed.expires as Date,
  });
  return res;
}
