'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, Clock, ChevronRight, Loader2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import useToast from '@/hooks/use-toast'
import { useTelegram } from '@/components/telegram-provider'
import { ScheduleDateBadge } from '@/components/schedule-date-badge'

// Types based on Prisma schema
interface Objective {
  id: string
  objective: string
}

interface Course {
  course_id: string
  course_name?: string | null
  course_description: string
  verse?: string | null
  created_at: Date
  objectives: Objective[]
}

interface Section {
  section_id: string
  section_name: string
}

interface Schedule {
  schedule_id: string
  course_id: string
  teacher_id: string
  created_at: Date
  updated_at: Date
  schedule_date: Date
  course: Course
  section?: Section
}

export function TeacherDashboard() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { webApp } = useTelegram()
  const pathname = usePathname()
  const locale = pathname?.split('/')[1] || 'am'

  useEffect(() => {
    fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    setLoading(true)
    setError(null)
    try {

      const authHeaders: HeadersInit = {}
      if (webApp?.initData) {
        authHeaders['x-telegram-init-data'] = webApp.initData
      }

      const response = await fetch(`/api/schedules`, {
        credentials: 'include', // Send session cookie
        headers: authHeaders,
      })
      const data = await response.json()
      if (response.ok) {
        setSchedules(data.schedules || [])
      } else {
        setError(data.error || 'Failed to load schedules')
        toast({
          title: 'Error',
          description: data.error || 'Failed to load schedules',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
      const errMsg = error instanceof Error ? error.message : 'Failed to load schedules'
      setError(errMsg)
      toast({
        title: 'Error',
        description: errMsg,
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcoming = schedules
    .filter((schedule) => new Date(schedule.schedule_date) >= now)
    .sort((a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime())
  const upcomingSchedule = upcoming[0]
  const upcomingWithinWeek = upcoming.filter((s) => new Date(s.schedule_date) <= nextWeek).length

  return (
    <div className="p-4 space-y-5 pb-6">
      <h1 className="text-2xl">የመምህር ዳሽቦርድ</h1>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border bg-card py-10">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">መርሃ ግብር በመጫን ላይ...</span>
        </div>
      ) : error ? (
        <div className="space-y-4 rounded-2xl border bg-card p-6 text-center">
          <p className="text-destructive">{error}</p>
          <Button onClick={fetchSchedules} variant="outline">
            እንደገና ሞክር
          </Button>
        </div>
      ) : (
        <>
          {/* Next class hero */}
          <div className="flex flex-col gap-3.5 rounded-[22px] border border-secondary bg-gradient-to-br from-secondary to-card p-5 shadow-[0_12px_30px_rgba(140,85,28,0.12)]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-primary">
                <Calendar className="h-4 w-4 text-primary-foreground" />
              </span>
              <div>
                <p className="text-[15px] font-bold leading-tight">ቀጣይ መርሃ ግብር</p>
                <p className="text-xs text-muted-foreground">የሚቀጥለው ክፍለ ጊዜ</p>
              </div>
            </div>

            {upcomingSchedule ? (
              <>
                <div className="h-px bg-border" />
                <div className="flex flex-col gap-1">
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(upcomingSchedule.schedule_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-lg font-bold">
                    {upcomingSchedule.course.course_name || upcomingSchedule.course.course_description || 'መርሃ ግብር'}
                  </p>
                  {upcomingSchedule.section?.section_name && (
                    <span className="mt-0.5 w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                      {upcomingSchedule.section.section_name}
                    </span>
                  )}
                </div>
                <Link
                  href={`/${locale}/teacher/schedules/${upcomingSchedule.schedule_id}`}
                  className="mt-0.5 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground"
                >
                  የትምህርቱ እቅድ ይመልከቱ
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            ) : (
              <div className="py-6 text-center">
                <Calendar className="mx-auto mb-2 h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">ምንም መርሃ ግብር የለም</p>
              </div>
            )}
          </div>

          {/* Stat tiles */}
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5 rounded-[18px] border bg-card p-4">
              <Calendar className="h-[18px] w-[18px] text-primary" />
              <p className="text-2xl font-bold">{schedules.length}</p>
              <p className="text-[11.5px] text-muted-foreground">ጠቅላላ መርሃ ግብሮች</p>
            </div>
            <div className="flex-1 space-y-1.5 rounded-[18px] border bg-card p-4">
              <Clock className="h-[18px] w-[18px] text-primary" />
              <p className="text-2xl font-bold">{upcomingWithinWeek}</p>
              <p className="text-[11.5px] text-muted-foreground">በሚቀጥለው 7 ቀናት</p>
            </div>
          </div>

          {/* My schedules */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-[15px] font-bold">የኔ መርሃ ግብሮች</p>
              <Link href={`/${locale}/teacher/my-schedules`} className="flex items-center gap-0.5 text-[12.5px] font-semibold text-primary">
                ሁሉንም ስትዩ
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">ምንም መርሃ ግብር የለም</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {upcoming.slice(0, 3).map((schedule) => (
                  <Link
                    key={schedule.schedule_id}
                    href={`/${locale}/teacher/schedules/${schedule.schedule_id}`}
                    className="flex items-center gap-3 rounded-2xl border bg-card p-3"
                  >
                    <ScheduleDateBadge date={schedule.schedule_date} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13.5px] font-semibold">
                        {schedule.course.course_name || schedule.course.course_description}
                      </p>
                      <p className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
                        {schedule.section?.section_name && (
                          <>
                            <Layers className="h-3 w-3" />
                            {schedule.section.section_name}
                          </>
                        )}
                        {' ● '}
                        {new Date(schedule.schedule_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
