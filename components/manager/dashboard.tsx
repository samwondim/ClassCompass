"use client"

import { useState, useEffect } from "react"
import { Calendar, Users, BookOpen, Bell, TrendingUp, Upload } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { ScheduleDateBadge } from "@/components/schedule-date-badge"

interface UpcomingSchedule {
  schedule_id: string
  schedule_date: string
  course: { course_name: string }
  teacher: { first_name: string; last_name: string }
  section: { section_name: string }
}

export function ManagerDashboard() {
  const t = useTranslations()
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "am"
  const managerBase = `/${locale}/manager`

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const requestOptions: RequestInit = { credentials: 'include' };
      const [schedulesRes, notificationsRes] = await Promise.all([
        fetch('/api/managers/schedules', requestOptions),
        fetch('/api/notifications', requestOptions),
      ])

      const schedulesData = await schedulesRes.json()
      const notificationsData = await notificationsRes.json()

      if (!schedulesRes.ok || !notificationsRes.ok) {
        throw new Error(schedulesData?.error || notificationsData?.error || t('Dashboard.ErrorLoading'))
      }

      const allSchedules = schedulesData.schedules || []
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcoming = allSchedules.filter((s: UpcomingSchedule) => {
        const scheduleDate = new Date(s.schedule_date)
        return scheduleDate >= now && scheduleDate <= nextWeek
      })

      setUpcomingSchedules(upcoming.slice(0, 5))
      setUnreadCount(notificationsData.notifications?.filter((n: any) => !n.is_read).length || 0)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: t('Common.Error'),
        description: error instanceof Error ? error.message : t('Dashboard.ErrorLoading'),
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    { href: `${managerBase}/teachers`, icon: Users, label: t('Dashboard.ManageTeachers'), tint: "bg-role-admin/14 text-role-admin" },
    { href: `${managerBase}/schedules`, icon: Calendar, label: t('Dashboard.ViewSchedules'), tint: "bg-primary/14 text-primary" },
    { href: `${managerBase}/courses`, icon: BookOpen, label: 'ትምህርቶችን ይመልከቱ', tint: "bg-[hsl(111,22%,35%)]/14 text-[hsl(111,22%,35%)]" },
    { href: `${managerBase}/notifications`, icon: Bell, label: t('Dashboard.Notifications'), badge: unreadCount, tint: "bg-role-manager/14 text-role-manager" },
    { href: `${managerBase}/bulk-upload`, icon: Upload, label: 'በጅምላ ይመዝግቡ', tint: "bg-destructive/14 text-destructive" },
  ]

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl text-foreground">የአስተዳዳሪ ዳሽቦርድ</h1>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            ፈጣን እርምጃዎች
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="relative flex flex-col items-center gap-2 rounded-2xl border bg-card p-3.5 text-center transition hover:bg-muted"
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-[10px] ${action.tint}`}>
                  <action.icon className="h-4 w-4" />
                </span>
                {action.badge !== undefined && action.badge > 0 && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {action.badge > 9 ? '9+' : action.badge}
                  </span>
                )}
                <span className="text-[11px] font-semibold leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Schedules */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('Dashboard.UpcomingSchedules')}
              </CardTitle>
              <CardDescription>{t('Dashboard.UpcomingDesc')}</CardDescription>
            </div>
            <Link href={`${managerBase}/schedules`}>
              <Button variant="outline" size="sm">ሁሉንም ይመልከቱ</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{t('Common.Loading')}</p>
          ) : upcomingSchedules.length === 0 ? (
            <p className="text-muted-foreground">{t('Dashboard.NoUpcoming')}</p>
          ) : (
            <div className="space-y-3">
              {upcomingSchedules.map((schedule) => (
                <div key={schedule.schedule_id} className="flex items-center gap-3 rounded-2xl border p-3">
                  <ScheduleDateBadge date={schedule.schedule_date} />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-[13.5px] font-semibold">{schedule.course.course_name}</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {schedule.teacher.first_name} {schedule.teacher.last_name} ● {schedule.section.section_name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
