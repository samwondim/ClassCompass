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
					headers: { 'x-telegram-init-data': webApp?.initData || '' }
				}),
				fetch('/api/representative/schedules', {
					headers: { 'x-telegram-init-data': webApp?.initData || '' }
				}),
				fetch('/api/courses', {
					headers: { 'x-telegram-init-data': webApp?.initData || '' }
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
		<AppLayout userRole="representative">
			<div className="p-4">
				<h1 className="text-2xl font-bold text-sky-700 mb-4">Class Representative Dashboard</h1>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
					<TabsList className="grid grid-cols-4 h-auto">
						<TabsTrigger value="dashboard" className="py-2">
							Dashboard
						</TabsTrigger>
						<TabsTrigger value="teachers" className="py-2">
							Teachers
						</TabsTrigger>
						<TabsTrigger value="schedule" className="py-2">
							Schedule
						</TabsTrigger>
						<TabsTrigger value="courses" className="py-2">
							Courses
						</TabsTrigger>
					</TabsList>

					<TabsContent value="dashboard" className="space-y-4">
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

						<Card>
							<CardHeader>
								<CardTitle>Quick Actions</CardTitle>
								<CardDescription>Manage your classroom and assignments</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4">
								<Button
									variant="outline"
									className="justify-start h-auto py-4"
									onClick={() => setActiveTab("teachers")}
								>
									<Users className="mr-2 h-5 w-5 text-sky-600" />
									<div className="text-left">
										<div className="font-medium">Manage Teachers</div>
										<div className="text-xs text-muted-foreground">Assign and manage your teachers</div>
									</div>
								</Button>
								<Button
									variant="outline"
									className="justify-start h-auto py-4"
									onClick={() => setActiveTab("schedule")}
								>
									<Calendar className="mr-2 h-5 w-5 text-sky-600" />
									<div className="text-left">
										<div className="font-medium">Manage Schedules</div>
										<div className="text-xs text-muted-foreground">Create and adjust class times</div>
									</div>
								</Button>
								<Button
									variant="outline"
									className="justify-start h-auto py-4"
									onClick={() => setActiveTab("courses")}
								>
									<BookOpen className="mr-2 h-5 w-5 text-sky-600" />
									<div className="text-left">
										<div className="font-medium">Manage Courses</div>
										<div className="text-xs text-muted-foreground">Add and edit course information</div>
									</div>
								</Button>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Recent Activity</CardTitle>
								<CardDescription>Latest updates for your class</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex items-center justify-center py-8">
									<div className="text-center space-y-2">
										<div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
											<Clock className="h-6 w-6 text-muted-foreground" />
										</div>
										<p className="text-sm text-muted-foreground">No recent activity</p>
										<p className="text-xs text-muted-foreground">Activity will appear here once you manage your schedule</p>
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="teachers">
						<TeacherManagement />
					</TabsContent>

					<TabsContent value="schedule">
						<ScheduleManagement />
					</TabsContent>

					<TabsContent value="courses">
						<CourseManagement />
					</TabsContent>
				</Tabs>
			</div>
		</AppLayout>
	)
}
