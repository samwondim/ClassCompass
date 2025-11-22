// i18n/requests.ts
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale || 'am'; // Fallback to 'en' if undefined
  return {
    locale,
    // Use ./messages/ for sibling folder (adjust if messages/ is elsewhere)
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
