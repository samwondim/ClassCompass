"use client"
import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { redirect, usePathname, useRouter } from "next/navigation"
import {
  Calendar,
  Home,
  BookOpen,
  Settings,
  LogOut,
  User,
  Bell,
  LayoutDashboard,
  BrainCog,
  LayoutDashboardIcon,
  ChevronLeft,
  Sun,
  Moon,
  SunDim,
  Laptop,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslations } from 'next-intl'
import { useTheme } from "@/components/theme-provider"
import type { ThemeMode } from "@/components/theme-provider"


interface AppLayoutProps {
  children: React.ReactNode
  userRole: string | null
}

async function logout() {
  const res = await fetch("/api/auth/logout", { method: "POST" });
  console.log(res)
  window.location.href = "/am";
}

export function AppLayout({ children, userRole }: AppLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const t = useTranslations()
  const { theme, resolvedTheme, setTheme } = useTheme()

  const themeOptions: { value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "light", label: t("Theme.Light"), icon: Sun },
    { value: "dark", label: t("Theme.Dark"), icon: Moon },
    { value: "system", label: t("Theme.System"), icon: Laptop },
  ]
  const ThemeTriggerIcon = theme === "dark" ? Moon : theme === "light" ? Sun : SunDim

  useEffect(() => {
    setIsMounted(true)
    fetchUnreadCount()
  }, [])

  const locale = pathname?.split("/")[1] || "am"
  const rolePath = userRole ? `/${locale}/${userRole.toLowerCase()}` : `/${locale}`

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push(rolePath)
    }
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (event.key !== "Escape") return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) {
        return
      }
      handleBack()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [rolePath])

  const touchStart = React.useRef<{ x: number; y: number } | null>(null)
  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current
    if (!start) return
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    touchStart.current = null

    if (absX < 60 || absX < absY * 1.5) return
    handleBack()
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const { notifications } = await res.json()
        const unread = notifications.filter((n: any) => !n.is_read).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  if (!isMounted) {
    return null
  }

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  let navItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = []

  switch (userRole) {
    case "ADMIN":
      navItems = [

        { label: t('Navigation.Dashboard'), href: "/am/admin/", icon: LayoutDashboardIcon },
        { label: t('Navigation.Teachers'), href: "/am/admin/teachers", icon: User },
        { label: t('Navigation.Managers'), href: "/am/admin/managers", icon: User },
        { label: t('Navigation.Schedules'), href: "/am/admin/schedules", icon: Calendar },
        { label: t('Navigation.Courses'), href: "/am/admin/courses", icon: BrainCog },
      ]
      break
    case "MANAGER":
      navItems = [
        { label: t('Navigation.Dashboard'), href: "/am/manager/", icon: LayoutDashboardIcon },
        { label: t('Navigation.Teachers'), href: "/am/manager/teachers", icon: User },
        { label: t('Navigation.Courses'), href: "/am/manager/courses", icon: BrainCog },
        { label: t('Navigation.Schedules'), href: "/am/manager/schedules", icon: Calendar },
      ]
      break
    case "TEACHER":
      navItems = [
        { label: t('Navigation.Dashboard'), href: "/am/teacher/", icon: LayoutDashboardIcon },
        { label: t('Navigation.MySchedules'), href: "/am/teacher/my-schedules", icon: Calendar },
      ]
      break
  }

  const notificationsPath = userRole === "ADMIN" ? "/am/admin/notifications" :
    userRole === "MANAGER" ? "/am/manager/notifications" :
      "/am/teacher/notifications"

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-full bg-sky-100 p-1">
              <Calendar className="h-5 w-5 text-sky-600" />
            </div>
            <span className="text-lg font-bold text-sky-700 hidden md:inline-block">{t('Common.Priscila')}</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href={notificationsPath}>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                aria-label={t('Theme.Title')}
              >
                <span className="sr-only">{t('Theme.Title')}</span>
                <ThemeTriggerIcon className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {themeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onSelect={(event) => {
                    event.preventDefault()
                    setTheme(option.value)
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <span>{option.label}</span>
                  </div>
                  {theme === option.value && <Check className="h-4 w-4 text-sky-600" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-sky-100 text-sky-700">
                    {userRole === "admin" ? "AD" : userRole === "manager" ? "MG" : "TC"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>{t('Navigation.Profile')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>{t('Navigation.Settings')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>
                  <form action={logout}>
                    <button className="nav-link">{t('Navigation.LogOut')}</button>
                  </form>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Content - Added pb-24 on mobile to account for floating bottom nav */}
        <main
          className="flex-1 pb-24 md:pb-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </main>
      </div>
      {/* Bottom Navigation (mobile only) - Floating Telegram-style */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <nav className="flex items-center justify-around rounded-2xl bg-white/95 shadow-xl border border-slate-200 backdrop-blur px-2 py-1">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition ${isActive(item.href) ? "text-sky-700 font-semibold" : "text-slate-600"
                }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${isActive(item.href) ? "bg-sky-100" : "bg-slate-100"}`}>
                <item.icon className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
