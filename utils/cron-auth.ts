// Shared authorization for Vercel cron endpoints.
//
// Accepted mechanisms (either is sufficient):
//  1. `Authorization: Bearer <CRON_SECRET>` (for manual/external triggers)
//  2. Vercel's injected `x-vercel-cron: 1` header (set automatically on scheduled runs)
//
// Vercel sets `x-vercel-cron` on cron invocations and prevents clients from
// spoofing it, so accepting it is safe on Vercel. When CRON_SECRET is configured
// we additionally allow authenticated manual triggers, without breaking Vercel's
// scheduled runs.
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth === `Bearer ${secret}`) return true;
  }

  return request.headers.get('x-vercel-cron') === '1';
}
