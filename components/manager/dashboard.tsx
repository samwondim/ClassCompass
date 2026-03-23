"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Users, BookOpen, Bell, AlertCircle, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { useTelegram } from "@/components/telegram-provider"

interface DashboardStats {
  teachers: number
  sections: number
  schedules: number
  courses: number
  upcomingSchedules: number
  unreadNotifications: number
}

interface Section {
  section_id: string
  section_name: string
}

interface UpcomingSchedule {
  schedule_id: string
  schedule_date: string
  course: { course_name: string }
  teacher: { first_name: string; last_name: string }
  section: { section_name: string }
}

export function ManagerDashboard() {
  const t = useTranslations()
  const [stats, setStats] = useState<DashboardStats>({
    teachers: 0,
    sections: 0,
    schedules: 0,
    courses: 0,
    upcomingSchedules: 0,
    unreadNotifications: 0
  })
  const [sections, setSections] = useState<Section[]>([])
  const [upcomingSchedules, setUpcomingSchedules] = useState<UpcomingSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "am"
  const managerBase = `/${locale}/manager`
  const { webApp } = useTelegram()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const authHeaders: HeadersInit = {}
      if (webApp?.initData) {
        authHeaders['x-telegram-init-data'] = webApp.initData
      }
      const requestOptions: RequestInit = { credentials: 'include', headers: authHeaders };
      const [teachersRes, sectionsRes, schedulesRes, coursesRes, notificationsRes] = await Promise.all([
        fetch('/api/managers/teachers', requestOptions),
        fetch('/api/managers/sections', requestOptions),
        fetch('/api/managers/schedules', requestOptions),
        fetch('/api/courses', requestOptions),
        fetch('/api/notifications', requestOptions)
      ])

      const [teachersData, sectionsData, schedulesData, coursesData, notificationsData] = await Promise.all([
        teachersRes.json(),
        sectionsRes.json(),
        schedulesRes.json(),
        coursesRes.json(),
        notificationsRes.json()
      ])

      if (!teachersRes.ok || !sectionsRes.ok || !schedulesRes.ok || !coursesRes.ok || !notificationsRes.ok) {
        const errorMessage =
          teachersData?.error ||
          sectionsData?.error ||
          schedulesData?.error ||
          coursesData?.error ||
          notificationsData?.error ||
          t('Dashboard.ErrorLoading')
        throw new Error(errorMessage)
      }

      const allSchedules = schedulesData.schedules || []

        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        const upcoming = allSchedules.filter((s: UpcomingSchedule) => {
          const scheduleDate = new Date(s.schedule_date)
          return scheduleDate >= now && scheduleDate <= nextWeek
        })

        setStats({
          teachers: teachersData.teachers?.length || 0,
          sections: sectionsData.sections?.length || 0,
          schedules: allSchedules.length,
          courses: coursesData.courses?.length || 0,
          upcomingSchedules: upcoming.length,
          unreadNotifications: notificationsData.notifications?.filter((n: any) => !n.is_read).length || 0
        })

      setSections(sectionsData.sections || [])
      setUpcomingSchedules(upcoming.slice(0, 5))
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

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">{t('Dashboard.ManagerTitle')}</h1>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          {t('Common.Refresh')}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('Navigation.Teachers')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? '...' : stats.teachers}
            </div>
            <p className="text-xs text-muted-foreground">{t('Dashboard.InYourSections')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('Dashboard.Sections')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? '...' : stats.sections}
            </div>
            <p className="text-xs text-muted-foreground">{t('Dashboard.YouManage')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t('Navigation.Schedules')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? '...' : stats.schedules}
            </div>
            <p className="text-xs text-muted-foreground">{t('Dashboard.TotalSchedules')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('Dashboard.Upcoming')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {loading ? '...' : stats.upcomingSchedules}
            </div>
            <p className="text-xs text-muted-foreground">{t('Dashboard.Next7Days')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t('Navigation.Courses')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {loading ? '...' : stats.courses}
            </div>
            <p className="text-xs text-muted-foreground">{t('Dashboard.Available')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {t('Dashboard.Alerts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '...' : stats.unreadNotifications}
            </div>
            <p className="text-xs text-muted-foreground">{t('Dashboard.Unread')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sections Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {t('Dashboard.YourSections')}
          </CardTitle>
          <CardDescription>{t('Dashboard.YourSectionsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">{t('Common.Loading')}</p>
          ) : sections.length === 0 ? (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <p>{t('Dashboard.NoAssignedSections')}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {sections.map((section) => (
                <Badge key={section.section_id} variant="secondary" className="text-sm px-3 py-1">
                  {section.section_name}
                </Badge>
              ))}
            </div>
          )}
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
              <Button variant="outline" size="sm">{t('Common.ViewAll')}</Button>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('Dashboard.QuickActions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href={`${managerBase}/teachers`}>
              <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" />
                {t('Dashboard.ManageTeachers')}
              </Button>
            </Link>
            <Link href={`${managerBase}/schedules`}>
              <Button variant="outline" className="w-full">
                <Calendar className="mr-2 h-4 w-4" />
                {t('Dashboard.ViewSchedules')}
              </Button>
            </Link>
            <Link href={`${managerBase}/courses`}>
              <Button variant="outline" className="w-full">
                <BookOpen className="mr-2 h-4 w-4" />
                {t('Dashboard.BrowseCourses')}
              </Button>
            </Link>
            <Link href={`${managerBase}/notifications`}>
              <Button variant="outline" className="w-full">
                <Bell className="mr-2 h-4 w-4" />
                {t('Dashboard.Notifications')}
                {stats.unreadNotifications > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.unreadNotifications}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
