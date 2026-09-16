'use client'

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Users, BookOpen, TrendingUp, UserCheck, Upload, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"

interface UpcomingSchedule {
  schedule_id: string
  schedule_date: string
  course: { course_name: string }
  teacher: { first_name: string; last_name: string }
  section: { section_name: string }
}

interface Section {
  section_id: string
  section_name: string
}

export function AdminDashboard() {
  const t = useTranslations()
  const [sections, setSections] = useState<Section[]>([])
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "am"
  const adminBase = `/${locale}/admin`
  const [selectedSectionId, setSelectedSectionId] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchDashboardData(selectedSectionId)
  }, [selectedSectionId])

  const fetchDashboardData = async (sectionId?: string) => {
    setLoading(true)
    try {
      const query = sectionId && sectionId !== 'all' ? `?section_id=${sectionId}` : ''
      const requestOptions: RequestInit = { credentials: 'include' };
      const [sectionsRes, schedulesRes, notificationsRes] = await Promise.all([
        fetch('/api/sections', requestOptions),
        fetch(`/api/schedules${query}`, requestOptions),
        fetch('/api/notifications', requestOptions),
      ])

      const [sectionsData, schedulesData, notificationsData] = await Promise.all([
        sectionsRes.json(),
        schedulesRes.json(),
        notificationsRes.json(),
      ])

      const allSchedules = schedulesData.schedules || []
      const now = new Date()
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      const upcoming = allSchedules.filter((s: UpcomingSchedule) => {
        const scheduleDate = new Date(s.schedule_date)
        return scheduleDate >= now && scheduleDate <= nextWeek
      })

      setSections(sectionsData.sections || [])
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
    { href: `${adminBase}/teachers/new`, icon: Users, label: t('Dashboard.AddTeacher') },
    { href: `${adminBase}/managers/new`, icon: UserCheck, label: t('Dashboard.AddManager') },
    { href: `${adminBase}/courses/new`, icon: BookOpen, label: t('Dashboard.AddCourse') },
    { href: `${adminBase}/sections/new`, icon: Calendar, label: t('Dashboard.AddSection') },
    { href: `${adminBase}/bulk-upload`, icon: Upload, label: 'ስብስብ መረጃ ማስገቢያ' },
    { href: `${adminBase}/notifications`, icon: Bell, label: t('Dashboard.Notifications'), badge: unreadCount },
  ]

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">የአድሚን ዳሽቦርድ</h1>
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
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="relative flex flex-col items-center justify-center gap-2 rounded-lg bg-primary/10 p-4 text-center transition hover:bg-primary/20"
              >
                <action.icon className="h-6 w-6 text-primary" />
                {action.badge !== undefined && action.badge > 0 && (
                  <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                    {action.badge > 9 ? '9+' : action.badge}
                  </span>
                )}
                <span className="text-sm font-medium leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Schedules */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('Dashboard.UpcomingSchedules')}
              </CardTitle>
              <CardDescription>{t('Dashboard.UpcomingDesc')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select onValueChange={(v) => setSelectedSectionId(v === 'all' ? undefined : v)} value={selectedSectionId}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="ሁሉንም ክፍሎች" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ሁሉንም ክፍሎች</SelectItem>
                  {sections.map((section) => (
                    <SelectItem key={section.section_id} value={section.section_id}>
                      {section.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Link href={`${adminBase}/schedules`}>
                <Button variant="outline" size="sm">ሁሉንም ይመልከቱ</Button>
              </Link>
            </div>
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
                <div key={schedule.schedule_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{schedule.course.course_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.teacher.first_name} {schedule.teacher.last_name} - {schedule.section.section_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(schedule.schedule_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(schedule.schedule_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
