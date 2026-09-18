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
  LayersIcon,
  Menu,
  X,
  Sun,
  Moon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTranslations } from 'next-intl'
import { useTheme } from "@/components/theme-provider"


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
  const t = useTranslations()
  const { resolvedTheme, toggleTheme } = useTheme()

  useEffect(() => {
    setIsMounted(true)
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
    { label: t('Navigation.Units'), href: `/${locale}/admin/units`, icon: LayersIcon },
  ]

  const managerNavItems = [
    { label: t('Navigation.Dashboard'), href: `/${locale}/manager`, icon: LayoutDashboardIcon },
    { label: t('Navigation.Teachers'), href: `/${locale}/manager/teachers`, icon: GraduationCap },
    { label: t('Navigation.Courses'), href: `/${locale}/manager/courses`, icon: BrainCog },
    { label: t('Navigation.Units'), href: `/${locale}/manager/units`, icon: LayersIcon },
    { label: t('Navigation.Schedules'), href: `/${locale}/manager/schedules`, icon: Calendar },
    { label: t('Navigation.MySchedules'), href: `/${locale}/manager/my-schedules`, icon: CalendarCheck },
  ]

  const teacherNavItems = [
    { label: t('Navigation.Dashboard'), href: `/${locale}/teacher`, icon: LayoutDashboardIcon },
    { label: t('Navigation.MySchedules'), href: `/${locale}/teacher/my-schedules`, icon: CalendarCheck },
  ]

  const roleNavItems = userRole === "ADMIN" ? adminNavItems : userRole === "MANAGER" ? managerNavItems : teacherNavItems

  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim()
  const roleLabel = userRole ? userRole.charAt(0) + userRole.slice(1).toLowerCase() : ""

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
            <span className="text-2xl font-bold text-primary">{t('Common.AppName')}</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setNavOpen(prev => !prev)}
            aria-label={navOpen ? "Close menu" : "Open menu"}
          >
            {navOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Full-width navigation panel */}
      {navOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setNavOpen(false)} />
          <nav className="fixed inset-x-0 top-16 z-50 border-b bg-card shadow-xl">
            <div className="mx-auto max-h-[calc(100vh-4rem)] w-full max-w-3xl overflow-y-auto p-4">
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

              <div className="my-3 border-t" />

              {/* Nav items */}
              <div className="flex flex-col gap-1">
                {roleNavItems.map((item) => (
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
            </div>
          </nav>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 pb-6">
        {children}
      </main>
    </div>
  )
}
