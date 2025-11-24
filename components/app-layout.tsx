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
import { logout } from "../utils/session"


interface AppLayoutProps {
  children: React.ReactNode
  userRole: string | null
}

export function AppLayout({ children, userRole }: AppLayoutProps) {
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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

        { label: "Dashboard", href: "/admin/", icon: LayoutDashboardIcon },
        { label: "Teachers", href: "/admin/teachers", icon: User },
        { label: "Managers", href: "/admin/managers", icon: User },
        { label: "Schedules", href: "/admin/schedules", icon: Calendar },
        { label: "Courses", href: "/admin/courses", icon: BrainCog },
      ]
      break
    case "MANAGER":
      navItems = [
        { label: "Dashboard", href: "/manager/", icon: LayoutDashboardIcon },
        { label: "Teachers", href: "/manager/teachers", icon: User },
        { label: "Courses", href: "/manager/courses", icon: BrainCog },
        { label: "Schedules", href: "/manager/schedules", icon: Calendar },
      ]
      break
    case "TEACHER":
      navItems = [
        { label: "Dashboard", href: "/teacher/", icon: LayoutDashboardIcon },
        { label: "My Schedules", href: "/teacher/my-schedules", icon: Calendar },
      ]
      break
  }

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
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <VisuallyHidden>
                <SheetTitle>Navigation Menu</SheetTitle>
              </VisuallyHidden>
              <div className="flex h-16 items-center border-b">
                <Link href="/" className="flex items-center gap-2">
                  <div className="rounded-full bg-sky-100 p-1">
                    <Calendar className="h-5 w-5 text-sky-600" />
                  </div>
                  <span className="text-lg font-bold text-sky-700">Priscila</span>
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
            <span className="text-lg font-bold text-sky-700 hidden md:inline-block">Priscila</span>
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              3
            </span>
          </Button>
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
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>
                  <form action={logout}>
                    <button className="nav-link">LogOut</button>
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
