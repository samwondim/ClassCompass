import { NextResponse } from 'next/server';
import { runWednesdaySundayCheck } from '@/utils/wednesday-sunday-check';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';


    const result = await runWednesdaySundayCheck({ force });

    if ('skipped' in result && result.skipped) {
      return NextResponse.json({
        message: result.reason,
        weekday: result.weekday,
        timeZone: result.timeZone,
        status: 'skipped'
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Wednesday Sunday check cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}
