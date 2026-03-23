import { NextResponse } from 'next/server';
import { runEmptyScheduleAlert } from '@/utils/empty-schedule-alert';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runEmptyScheduleAlert();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Empty schedule alert cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: String(error) },
      { status: 500 }
    );
  }
}
