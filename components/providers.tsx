'use client';

import { NextIntlClientProvider } from 'next-intl';
import { Toaster } from '@/components/ui/toaster';
import { TelegramProvider } from '@/components/telegram-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
  messages: any; // Or type from next-intl
  locale: string; // New: Required for provider
}

export function Providers({ children, messages, locale }: ProvidersProps) {
  return (
    <TelegramProvider>
      <ThemeProvider>
      <NextIntlClientProvider messages={messages} locale={locale}> {/* Add locale */}
        {children}
        <Toaster />
      </NextIntlClientProvider>
      </ThemeProvider>
    </TelegramProvider>
  );
}
