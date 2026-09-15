import { getSession, updateSession } from "@/utils/session";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const session = await getSession(request);

  if (session) {
    return NextResponse.json({ isAuthenticated: true });
  } else {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  const res = await updateSession(request);
  return res ?? NextResponse.json({ error: "No session" }, { status: 401 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return NextResponse.json({ success: true });
}
