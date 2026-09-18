"use client"
import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Calendar,
  BookOpen,
  LogOut,
  BrainCog,
  LayoutDashboardIcon,
  GraduationCap,
  Briefcase,
  CalendarCheck,
  Sun,
  Moon,
  Settings,
  MoreHorizontal,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from 'next-intl'
import { useTheme } from "@/components/theme-provider"

// Logging out just bounces a real user back to Telegram auth with nothing to
// switch to, so only show it where dev login is enabled (to swap between
// seeded roles while testing).
const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === 'true'

interface AppLayoutProps {
  children: React.ReactNode
  userRole: string | null
  photoUrl?: string | null
  firstName?: string | null
  lastName?: string | null
}

export function AppLayout({ children, userRole, photoUrl, firstName, lastName }: AppLayoutProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [appName, setAppName] = useState<string | null>(null)
  const t = useTranslations()
  const { resolvedTheme, toggleTheme } = useTheme()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.settings?.app_name) setAppName(data.settings.app_name)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  // Close the navigation when the route changes
  useEffect(() => {
    setNavOpen(false)
  }, [pathname])

  // Close the navigation on Escape
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setNavOpen(false)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const locale = pathname?.split("/")[1] || "am"
  const rolePath = userRole ? `/${locale}/${userRole.toLowerCase()}` : `/${locale}`

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

  const adminNavItems = [
    { label: t('Navigation.Dashboard'), href: `/${locale}/admin`, icon: LayoutDashboardIcon },
    { label: t('Navigation.Teachers'), href: `/${locale}/admin/teachers`, icon: GraduationCap },
    { label: t('Navigation.Managers'), href: `/${locale}/admin/managers`, icon: Briefcase },
    { label: t('Navigation.Sections'), href: `/${locale}/admin/sections`, icon: BookOpen },
    { label: t('Navigation.Schedules'), href: `/${locale}/admin/schedules`, icon: Calendar },
    { label: t('Navigation.MySchedules'), href: `/${locale}/admin/my-schedules`, icon: CalendarCheck },
    { label: t('Navigation.Courses'), href: `/${locale}/admin/courses`, icon: BrainCog },
    { label: t('Navigation.Settings'), href: `/${locale}/admin/settings`, icon: Settings },
  ]

  const managerNavItems = [
    { label: t('Navigation.Dashboard'), href: `/${locale}/manager`, icon: LayoutDashboardIcon },
    { label: t('Navigation.Teachers'), href: `/${locale}/manager/teachers`, icon: GraduationCap },
    { label: t('Navigation.Courses'), href: `/${locale}/manager/courses`, icon: BrainCog },
    { label: t('Navigation.Schedules'), href: `/${locale}/manager/schedules`, icon: Calendar },
    { label: t('Navigation.MySchedules'), href: `/${locale}/manager/my-schedules`, icon: CalendarCheck },
  ]

  const teacherNavItems = [
    { label: t('Navigation.Dashboard'), href: `/${locale}/teacher`, icon: LayoutDashboardIcon },
    { label: t('Navigation.MySchedules'), href: `/${locale}/teacher/my-schedules`, icon: CalendarCheck },
  ]

  const roleNavItems = userRole === "ADMIN" ? adminNavItems : userRole === "MANAGER" ? managerNavItems : teacherNavItems

  // The 3 items each role reaches for daily live in the bottom tab bar; the
  // rest (plus profile/logout) live behind the trailing "More" tab.
  const primaryHrefs =
    userRole === "ADMIN"
      ? [`/${locale}/admin`, `/${locale}/admin/schedules`, `/${locale}/admin/my-schedules`]
      : userRole === "MANAGER"
        ? [`/${locale}/manager`, `/${locale}/manager/schedules`, `/${locale}/manager/my-schedules`]
        : [`/${locale}/teacher`, `/${locale}/teacher/my-schedules`]

  const primaryNavItems = primaryHrefs
    .map((href) => roleNavItems.find((item) => item.href === href))
    .filter((item): item is typeof roleNavItems[number] => Boolean(item))
  const overflowNavItems = roleNavItems.filter((item) => !primaryHrefs.includes(item.href))
  const hasOverflow = overflowNavItems.length > 0

  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim()
  const roleLabel = userRole ? userRole.charAt(0) + userRole.slice(1).toLowerCase() : ""
  const roleColorClass =
    userRole === "ADMIN"
      ? "bg-role-admin/12 text-role-admin"
      : userRole === "MANAGER"
        ? "bg-role-manager/12 text-role-manager"
        : "bg-secondary text-secondary-foreground"

  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
    }
    if (firstName) {
      return firstName.substring(0, 2).toUpperCase()
    }
    if (userRole) {
       const role = userRole.toUpperCase()
       return role === "ADMIN" ? "AD" : role === "MANAGER" ? "MG" : "TC"
    }
    return "US"
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
    } catch (error) {
      console.error('Logout error:', error);
    }
    window.location.href = `/${locale}`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-card px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-display text-2xl text-primary">{appName || t('Common.AppName')}</span>
          </Link>
          {roleLabel && (
            <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-bold ${roleColorClass}`}>
              {roleLabel}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* "More" sheet: overflow nav items + profile + logout */}
      {navOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setNavOpen(false)} />
          <nav className="fixed inset-x-0 bottom-[72px] z-50 rounded-t-3xl border-t bg-card shadow-xl">
            <div className="mx-auto max-h-[calc(100vh-9rem)] w-full max-w-3xl overflow-y-auto p-4">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-border" />

              {/* Profile */}
              <Link
                href={rolePath}
                onClick={() => setNavOpen(false)}
                className="flex items-center gap-3 rounded-lg p-3 transition hover:bg-muted"
              >
                <Avatar className="h-10 w-10">
                  {photoUrl && <AvatarImage src={photoUrl} alt={firstName || ""} />}
                  <AvatarFallback className="bg-primary/10 text-primary">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{displayName || t('Navigation.Profile')}</p>
                  {roleLabel && <p className="text-xs text-muted-foreground">{roleLabel}</p>}
                </div>
              </Link>

              {overflowNavItems.length > 0 && (
                <>
                  <div className="my-3 border-t" />
                  <div className="flex flex-col gap-1">
                    {overflowNavItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setNavOpen(false)}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition ${
                          isActive(item.href)
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <item.icon className="h-6 w-6 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {DEV_LOGIN_ENABLED && (
                <>
                  <div className="my-3 border-t" />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium text-destructive transition hover:bg-muted"
                  >
                    <LogOut className="h-6 w-6 shrink-0" />
                    <span>{t('Navigation.LogOut')}</span>
                  </button>
                </>
              )}
            </div>
          </nav>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom tab bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex h-[72px] border-t bg-card pb-[env(safe-area-inset-bottom)]">
        {primaryNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
              isActive(item.href) ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setNavOpen((prev) => !prev)}
          aria-label={hasOverflow ? t('Navigation.More') : t('Navigation.Profile')}
          className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
            navOpen ? "text-primary" : "text-muted-foreground"
          }`}
        >
          {hasOverflow ? <MoreHorizontal className="h-5 w-5" /> : <User className="h-5 w-5" />}
          {hasOverflow ? t('Navigation.More') : t('Navigation.Profile')}
        </button>
      </div>
    </div>
  )
}
