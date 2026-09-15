import { NextResponse } from "next/server";
import { runSundayReminder } from "@/utils/sunday-reminder";
import { isAuthorizedCronRequest } from "@/utils/cron-auth";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get("force") === "true";

    const result = await runSundayReminder({ force });
    if ("skipped" in result && result.skipped) {
      return NextResponse.json({ message: result.reason, timeZone: result.timeZone });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sunday reminder cron error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
