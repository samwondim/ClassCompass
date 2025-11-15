
'use client'

import { useState } from "react"
import { Calendar, Clock, FileSpreadsheet, Send, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppLayout } from "@/components/app-layout"
import { DataEntryForm } from "@/components/manager/data-entry-form"
import { TeachersList } from "@/components/manager/teachers-list"
import { ScheduleCalendar } from "@/components/manager/schedule-calendar"
import { ManageReminders } from "@/components/manager/manage-reminders"
import { AddTeacherForm } from "@/components/manager/add-teacher-form"
import { AddCourseForm } from "@/components/manager/add-course-form"
import { AddSectionForm } from "@/components/manager/add-section-form"
import { ClassRepresentativeManagement } from "@/components/manager/class-representative-management"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [activeForm, setActiveForm] = useState<null | 'teacher' | 'course' | 'section'>(null)

  const handleToggleForm = (formType: 'teacher' | 'course' | 'section') => {
    setActiveForm(activeForm === formType ? null : formType)
  }

  return (
    <AppLayout userRole="admin">
      <div className="p-4">
        <h1 className="text-2xl font-bold text-sky-700 mb-4">Welcome Admin</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-row md:flex-row">
            <TabsTrigger value="dashboard" className="py-2">
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="teachers" className="py-2">
              Teachers
            </TabsTrigger>
            <TabsTrigger value="representatives" className="py-2">
              Managers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-sky-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Teachers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">--</div>
                  <p className="text-xs text-muted-foreground">Add teachers to get started</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-sky-50 to-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Schedules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-muted-foreground">--</div>
                  <p className="text-xs text-muted-foreground">Create schedules to view</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your Sunday school</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-row justify-center">
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Button variant="secondary" onClick={() => handleToggleForm('teacher')}>
                      {activeForm === 'teacher' ? 'Cancel' : 'Add Users'}
                    </Button>
                    <Button variant="secondary" onClick={() => handleToggleForm('section')}>
                      {activeForm === 'section' ? 'Cancel' : 'Add Section'}
                    </Button>
                  </div>
                  {activeForm === 'teacher' && (
                    <AddTeacherForm
                      onCancel={() => setActiveForm(null)}
                      onSuccess={() => setActiveForm(null)}
                    />
                  )}
                  {activeForm === 'section' && (
                    <AddSectionForm
                      onCancel={() => setActiveForm(null)}
                      onSuccess={() => setActiveForm(null)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates to your Sunday school</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                    <p className="text-xs text-muted-foreground">Activity will appear here once you start managing your schedule</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers">
            <TeachersList />
          </TabsContent>

          <TabsContent value="representatives">
            <ClassRepresentativeManagement />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
