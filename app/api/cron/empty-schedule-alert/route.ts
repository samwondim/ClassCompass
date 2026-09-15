import { NextResponse } from 'next/server';
import { runEmptyScheduleAlert } from '@/utils/empty-schedule-alert';
import { isAuthorizedCronRequest } from '@/utils/cron-auth';

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runEmptyScheduleAlert();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Empty schedule alert cron error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
