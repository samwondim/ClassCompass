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
  GraduationCap,
  Briefcase
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslations } from 'next-intl'
import { useTheme } from "@/components/theme-provider"
import type { ThemeMode } from "@/components/theme-provider"


interface AppLayoutProps {
  children: React.ReactNode
  userRole: string | null
  photoUrl?: string | null
  firstName?: string | null
}

export function AppLayout({ children, userRole, photoUrl, firstName }: AppLayoutProps) {
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
    if (!pathname) return false
    const normalizedPath = path.endsWith('/') ? path.slice(0, -1) : path
    const normalizedCurrent = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
    if (normalizedCurrent === normalizedPath) return true
    const segments = normalizedPath.split('/')
    const currentSegments = normalizedCurrent.split('/')
    if (segments.length !== currentSegments.length) return false
    return segments.every((seg, i) => seg === currentSegments[i])
  }

  const navItems: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = []

  const adminNavItems = [
    { label: t('Navigation.Dashboard'), href: "/am/admin", icon: LayoutDashboardIcon },
    { label: t('Navigation.Teachers'), href: "/am/admin/teachers", icon: GraduationCap },
    { label: t('Navigation.Managers'), href: "/am/admin/managers", icon: Briefcase },
    { label: t('Navigation.Schedules'), href: "/am/admin/schedules", icon: Calendar },
    { label: t('Navigation.MySchedules'), href: "/am/admin/my-schedules", icon: Calendar },
    { label: t('Navigation.Courses'), href: "/am/admin/courses", icon: BrainCog },
  ]

  const managerNavItems = [
    { label: t('Navigation.Dashboard'), href: "/am/manager", icon: LayoutDashboardIcon },
    { label: t('Navigation.Teachers'), href: "/am/manager/teachers", icon: GraduationCap },
    { label: t('Navigation.Courses'), href: "/am/manager/courses", icon: BrainCog },
    { label: t('Navigation.Schedules'), href: "/am/manager/schedules", icon: Calendar },
    { label: t('Navigation.MySchedules'), href: "/am/manager/my-schedules", icon: Calendar },
  ]

  const teacherNavItems = [
    { label: t('Navigation.Dashboard'), href: "/am/teacher", icon: LayoutDashboardIcon },
    { label: t('Navigation.MySchedules'), href: "/am/teacher/my-schedules", icon: Calendar },
  ]

  const roleNavItems = userRole === "ADMIN" ? adminNavItems : userRole === "MANAGER" ? managerNavItems : teacherNavItems

  const notificationsPath = userRole === "ADMIN" ? "/am/admin/notifications" :
    userRole === "MANAGER" ? "/am/manager/notifications" :
      "/am/teacher/notifications"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-1">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-primary hidden md:inline-block">{t('Common.Priscila')}</span>
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
                  {theme === option.value && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  {photoUrl && <AvatarImage src={photoUrl} alt={firstName || ""} />}
                  <AvatarFallback className="bg-primary/10 text-primary">
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
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex flex-1 md:pl-64">
        <main
          className="flex-1 pb-24 md:pb-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {children}
        </main>
      </div>
      {/* Bottom Navigation - Floating Telegram-style (Only visible on mobile) */}
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-2xl mx-auto md:hidden">
        <nav className="flex items-center justify-around rounded-2xl bg-card/95 shadow-xl border border-border backdrop-blur px-2 py-1">
          {roleNavItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-[13px] transition ${isActive(item.href) ? "text-primary font-semibold" : "text-muted-foreground"
                }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isActive(item.href) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <item.icon className="h-5 w-5" />
              </span>
              <span className="md:text-[12px]">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Desktop Sidebar Navigation (Only visible on desktop) */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card fixed left-0 top-16 bottom-0 p-4 gap-2">
        {roleNavItems.map((item, index) => (
          <Link
            key={index}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive(item.href) ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted"}`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[14px]">{item.label}</span>
          </Link>
        ))}
      </aside>
    </div>
  )
}
