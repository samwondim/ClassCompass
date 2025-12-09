"use client"
import React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { redirect, usePathname } from "next/navigation"
import { Calendar, Home, BookOpen, Settings, LogOut, User, Bell, LayoutDashboard, BrainCog, LayoutDashboardIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { useTranslations } from 'next-intl'


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
  const [isMounted, setIsMounted] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const t = useTranslations()

  useEffect(() => {
    setIsMounted(true)
    fetchUnreadCount()
  }, [])

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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
                <span className="sr-only">{t('Navigation.Menu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <VisuallyHidden>
                <SheetTitle>{t('Navigation.Menu')}</SheetTitle>
              </VisuallyHidden>
              <div className="flex h-16 items-center border-b">
                <Link href="/" className="flex items-center gap-2">
                  <div className="rounded-full bg-sky-100 p-1">
                    <Calendar className="h-5 w-5 text-sky-600" />
                  </div>
                  <span className="text-lg font-bold text-sky-700">{t('Common.Priscila')}</span>
                </Link>
              </div>
              <nav className="mt-4 flex flex-col gap-2">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive(item.href) ? "bg-sky-100 text-sky-700 font-medium" : "text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
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
        {/* Side Navigation (desktop only) */}
        <nav className="hidden w-64 border-r bg-white md:block">
          <div className="flex flex-col gap-1 p-2">
            {navItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${isActive(item.href) ? "bg-sky-100 text-sky-700 font-medium" : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        {/* Content */}
        <main className="flex-1">{children}</main>
      </div>
      {/* Bottom Navigation (mobile only) */}
      <div className="md:hidden border-t bg-white">
        <nav className="flex items-center justify-around">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-1 py-2 text-xs ${isActive(item.href) ? "text-sky-700 font-medium" : "text-slate-600"
                }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
