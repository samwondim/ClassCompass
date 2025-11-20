'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button' // Assuming Shadcn/UI; replace if not
import {
  Home,
  Users,
  Calendar,
  Settings,
  BookOpen,
  GraduationCap,
} from 'lucide-react' // Icons; install lucide-react if needed

interface SidebarProps {
  role: 'ADMIN' | 'MANAGER' | 'TEACHER'
}

export default function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const navItems = {
    ADMIN: [
      { href: '/admin', label: 'Dashboard', icon: Home },
      { href: '/admin/users', label: 'Manage Users', icon: Users },
      { href: '/admin/schedules', label: 'Schedules', icon: Calendar },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
    MANAGER: [
      { href: '/manager', label: 'Dashboard', icon: Home },
      { href: '/manager/classes', label: 'My Classes', icon: GraduationCap },
      { href: '/manager/schedules', label: 'Schedules', icon: Calendar },
      { href: '/manager/reports', label: 'Reports', icon: BookOpen },
    ],
    TEACHER: [
      { href: '/teacher', label: 'Dashboard', icon: Home },
      { href: '/teacher/lessons', label: 'My Lessons', icon: BookOpen },
      { href: '/teacher/students', label: 'Students', icon: Users },
      { href: '/teacher/schedule', label: 'Schedule', icon: Calendar },
    ],
  }

  return (
    <nav className="w-64 bg-card border-r shadow-sm p-4 flex flex-col">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-foreground">ClassCompass</h1>
        <p className="text-sm text-muted-foreground capitalize">{role.toLowerCase()}</p>
      </div>
      <ul className="space-y-2 flex-1">
        {navItems[role].map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <li key={href}>
              <Link href={href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {label}
                </Button>
              </Link>
            </li>
          )
        })}
      </ul>
      {/* Optional: Add logout or profile at bottom */}
      <div className="mt-auto pt-4 border-t">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="mr-2 h-4 w-4" />
          Profile
        </Button>
      </div>
    </nav>
  )
}
