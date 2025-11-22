import type { Metadata } from 'next';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';
import { Providers } from '@/components/providers';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'ClassCompass',
  description: 'Sunday School Schedule Management',
  generator: 'ClassCompass',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale(); // Already here
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://telegram.org/js/telegram-web-app.js" async />
        {/* Fonts for Amharic */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Ethiopic:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-ethiopic">
        <Providers messages={messages} locale={locale}> {/* Pass locale */}
          {children}
        </Providers>
      </body>
    </html>
  );
}
