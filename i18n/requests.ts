// i18n/requests.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  // Only Amharic is supported; guard against any stale 'en' links
  const requested = await requestLocale;
  const locale = requested === 'en' ? 'am' : requested || 'am';
  return {
    locale,
    messages: (await import(`../messages/am.json`)).default,
  };
});
