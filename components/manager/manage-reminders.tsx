"use client"

import { useState } from "react"
import { Bell, Check, Clock, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ManageReminders() {
  const [reminderText, setReminderText] = useState(
    "Hello! This is a reminder that you're scheduled to teach this Sunday. Please review your lesson materials and arrive 15 minutes early. Thank you for your service!",
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Reminders</CardTitle>
        <CardDescription>Send notifications to teachers about upcoming classes</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100">
                    <Bell className="h-5 w-5 text-sky-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Midweek Reminder</h4>
                    <p className="text-sm text-muted-foreground">For teachers scheduled this Sunday (May 5)</p>
                  </div>
                </div>
                <Button>Send Now</Button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Day Before Reminder</h4>
                    <p className="text-sm text-muted-foreground">Scheduled to send Saturday evening (May 4)</p>
                  </div>
                </div>
                <Button variant="outline">Edit</Button>
              </div>
            </div>

            <Card className="mt-6">
              <CardHeader className="pb-3">
                <CardTitle>Custom Reminder</CardTitle>
                <CardDescription>Send a personalized message to specific teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      value={reminderText}
                      onChange={(e) => setReminderText(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Select Recipients</Label>
                    <div className="space-y-2">
                      {["Sarah Johnson", "Michael Chen", "David Wilson", "Rebecca Martinez", "James Taylor"].map(
                        (teacher) => (
                          <div key={teacher} className="flex items-center space-x-2">
                            <Switch id={`teacher-${teacher}`} />
                            <Label htmlFor={`teacher-${teacher}`}>{teacher}</Label>
                          </div>
                        ),
                      )}
                    </div>
                  </div>

                  <Button className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Send Custom Reminder
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Automated Reminders</CardTitle>
                <CardDescription>Configure when reminders are automatically sent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="midweek">Midweek Reminder</Label>
                    <p className="text-sm text-muted-foreground">Sent on Wednesday for upcoming Sunday</p>
                  </div>
                  <Switch id="midweek" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="day-before">Day Before Reminder</Label>
                    <p className="text-sm text-muted-foreground">Sent on Saturday evening at 6:00 PM</p>
                  </div>
                  <Switch id="day-before" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="morning-of">Morning Of Reminder</Label>
                    <p className="text-sm text-muted-foreground">Sent on Sunday morning at 7:00 AM</p>
                  </div>
                  <Switch id="morning-of" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reminder Templates</CardTitle>
                <CardDescription>Customize the message sent to teachers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="midweek-template">Midweek Template</Label>
                  <Textarea
                    id="midweek-template"
                    defaultValue="Hello! This is a reminder that you're scheduled to teach this Sunday. Please review your lesson materials. Thank you for your service!"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="day-before-template">Day Before Template</Label>
                  <Textarea
                    id="day-before-template"
                    defaultValue="Reminder: You're teaching tomorrow! Please arrive 15 minutes early to prepare your classroom. Thank you!"
                    rows={3}
                  />
                </div>

                <Button>Save Templates</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="space-y-4">
              {[
                { date: "April 28, 2025", type: "Day Before", recipients: 5 },
                { date: "April 24, 2025", type: "Midweek", recipients: 5 },
                { date: "April 21, 2025", type: "Day Before", recipients: 4 },
                { date: "April 17, 2025", type: "Midweek", recipients: 4 },
                { date: "April 14, 2025", type: "Custom", recipients: 2 },
              ].map((reminder, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{reminder.type} Reminder</h4>
                      <p className="text-sm text-muted-foreground">
                        Sent on {reminder.date} to {reminder.recipients} teachers
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
