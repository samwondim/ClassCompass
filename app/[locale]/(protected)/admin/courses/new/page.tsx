import { TelegramFormShell } from '@/components/telegram-form-shell'
import { CourseForm } from '@/components/forms/course-form'

export default function AdminNewCoursePage({ params }: { params: { locale: string } }) {
  const base = `/${params.locale}/admin`
  return (
    <TelegramFormShell title="አዲስ ትምህርት" description="የትምህርት መረጃዎትን እዚህ ይመዝግቡ">
      <CourseForm cancelHref={`${base}/courses`} onSuccessHref={`${base}/courses`} />
    </TelegramFormShell>
  )
}
