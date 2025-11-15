import type { Metadata } from 'next'
import './globals.css'
import { TelegramProvider } from '@/components/telegram-provider'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'ClassCompass',
  description: 'Sunday School Schedule Management',
  generator: 'ClassCompass',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://telegram.org/js/telegram-web-app.js" async></script>
      </head>
      <body>
        <TelegramProvider>
          {children}
          <Toaster />
        </TelegramProvider>
      </body>
    </html>
  )
}
