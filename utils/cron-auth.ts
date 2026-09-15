// Shared authorization for Vercel cron endpoints.
//
// Two accepted mechanisms:
//  1. `Authorization: Bearer <CRON_SECRET>` (preferred, works everywhere)
//  2. Vercel's injected `x-vercel-cron: 1` header (only when CRON_SECRET is unset)
//
// Unauthenticated requests are always rejected so cron jobs cannot be triggered
// by arbitrary internet traffic.
export function isAuthorizedCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const auth = request.headers.get('authorization');
    return auth === `Bearer ${secret}`;
  }

  return request.headers.get('x-vercel-cron') === '1';
}
