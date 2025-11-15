'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { WebApp, WebAppUser } from '@twa-dev/types'

interface ExtendedWebAppUser extends WebAppUser {
  phone_number?: string
}

interface TelegramContextType {
  webApp?: WebApp
  user?: ExtendedWebAppUser
  isReady: boolean
}

const TelegramContext = createContext<TelegramContextType>({
  isReady: false,
})

export const useTelegram = () => {
  const context = useContext(TelegramContext)
  if (!context) {
    throw new Error('useTelegram must be used within a TelegramProvider')
  }
  return context
}

interface TelegramProviderProps {
  children: ReactNode
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const [webApp, setWebApp] = useState<WebApp>()
  const [user, setUser] = useState<ExtendedWebAppUser>()
  const [isReady, setIsReady] = useState(false)



  useEffect(() => {
    const initTelegram = () => {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp
        tg.ready()

        tg.expand()
        tg.setHeaderColor('#000000')
        tg.setBackgroundColor('#ffffff')

        setWebApp(tg)
        setUser(tg.initDataUnsafe?.user as ExtendedWebAppUser | undefined)
        setIsReady(true)

        if (tg.BackButton) {
          tg.BackButton.hide()
        }

        if (tg.MainButton) {
          tg.MainButton.hide()
        }
      }
    }

    const pollTelegram = () => {
      if (window.Telegram) {
        initTelegram()
      } else {
        setTimeout(pollTelegram, 100)
      }
    }

    pollTelegram()
  }, [])

  const value = {
    webApp,
    user,
    isReady,
  }

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  )
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}
