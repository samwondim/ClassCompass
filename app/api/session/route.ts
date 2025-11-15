import { getSession, updateSession } from "@/utils/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  if (session) {
    return NextResponse.json({ isAuthenticated: true });
  } else {
    return NextResponse.json({ isAuthenticated: false }, { status: 401 });
  }
}

export async function PUT(request: NextRequest) {
  await updateSession(request);
}
