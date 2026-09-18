import type { Metadata } from 'next';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { Providers } from '@/components/providers';
import { ReactNode } from 'react';
import prisma from '@/lib/prisma';

export async function generateMetadata(): Promise<Metadata> {
  let appName = 'Sunday School Reminder';
  try {
    const settings = await prisma.appSettings.findUnique({ where: { id: 'app' } });
    if (settings?.app_name) appName = settings.app_name;
  } catch {
    // Fall back to the default name if the DB isn't reachable at build/request time.
  }

  return {
    title: appName,
    description: 'Sunday School Schedule Management',
    generator: appName,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale(); // Already here
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script dangerouslySetInnerHTML={{ __html: `if (typeof window !== 'undefined' && !window.TelegramGameProxy) { window.TelegramGameProxy = { receiveEvent: function() {} }; }` }} />
        <script src="https://telegram.org/js/telegram-web-app.js" async />
        {/* Fonts for Amharic */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Abyssinica+SIL&family=Noto+Sans+Ethiopic:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-ethiopic">
        <Providers messages={messages} locale={locale}> {/* Pass locale */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
