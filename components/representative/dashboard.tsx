"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, Users, BookOpen } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/app-layout"
import { TeacherManagement } from "@/components/representative/teacher-management"
import { ScheduleManagement } from "@/components/representative/schedule-management"
import { CourseManagement } from "@/components/representative/course-management"
import { useTelegram } from "@/components/telegram-provider"
import { useToast } from "@/hooks/use-toast"

interface DashboardStats {
  teachers: number
  sections: number
  schedules: number
  courses: number
}

export function RepresentativeDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [stats, setStats] = useState<DashboardStats>({ teachers: 0, sections: 0, schedules: 0, courses: 0 })
  const [loading, setLoading] = useState(true)
  const { webApp } = useTelegram()
  const { toast } = useToast()

  useEffect(() => {
    if (webApp?.initData) {
      fetchDashboardStats()
    }
  }, [webApp?.initData])

  const fetchDashboardStats = async () => {
    setLoading(true)
    try {
      const [teachersRes, schedulesRes, coursesRes] = await Promise.all([
        fetch('/api/representative/teachers', {
        }),
        fetch('/api/representative/schedules', {
        }),
        fetch('/api/courses', {
        })
      ])

      const [teachersData, schedulesData, coursesData] = await Promise.all([
        teachersRes.json(),
        schedulesRes.json(),
        coursesRes.json()
      ])

      if (teachersRes.ok && schedulesRes.ok && coursesRes.ok) {
        setStats({
          teachers: teachersData.teachers?.length || 0,
          sections: teachersData.sections?.length || 0,
          schedules: schedulesData.schedules?.length || 0,
          courses: coursesData.courses?.length || 0
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-sky-700 mb-4">Manager Dashboard</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-sky-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assigned Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700">
              {loading ? '...' : stats.teachers}
            </div>
            <p className="text-xs text-muted-foreground">Teachers under your management</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-sky-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Assigned Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700">
              {loading ? '...' : stats.sections}
            </div>
            <p className="text-xs text-muted-foreground">Sections under your management</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-sky-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Total Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700">
              {loading ? '...' : stats.schedules}
            </div>
            <p className="text-xs text-muted-foreground">Schedules you manage</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-sky-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Available Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sky-700">
              {loading ? '...' : stats.courses}
            </div>
            <p className="text-xs text-muted-foreground">Courses you can schedule</p>
          </CardContent>
        </Card>
      </div>



    </div>
  )
}
