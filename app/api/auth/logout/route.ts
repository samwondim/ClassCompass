
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete("session");

  return NextResponse.json({ message: "Done!" })
}
