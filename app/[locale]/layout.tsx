import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export default async function LocaleLayout({
    children,
    params: { locale }
}: {
    children: ReactNode;
    params: { locale: string };
}) {
    const messages = await getMessages();

    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
        </NextIntlClientProvider>
    );
}
