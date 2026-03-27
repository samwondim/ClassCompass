import { NextResponse } from 'next/server';
import { runSundayReminder } from '@/utils/sunday-reminder';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';


    const result = await runSundayReminder({ force });
    if ("skipped" in result && result.skipped) {
      return NextResponse.json({ message: result.reason, timeZone: result.timeZone });
    }
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: String(error) }, { status: 500 });
  }
}
