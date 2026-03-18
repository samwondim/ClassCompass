import { NextResponse } from "next/server";
import { runSundayReminder } from "@/utils/sunday-reminder";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const force = searchParams.get("force") === "true";

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await runSundayReminder({ force });
    if ("skipped" in result && result.skipped) {
      return NextResponse.json({ message: result.reason, timeZone: result.timeZone });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sunday reminder cron error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
