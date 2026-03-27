import { TelegramFormShell } from '@/components/telegram-form-shell'
import { TeacherForm } from '@/components/forms/teacher-form'

export default function AdminNewTeacherPage({ params }: { params: { locale: string } }) {
  const base = `/${params.locale}/admin`
  return (
    <TelegramFormShell title="መምህር መዝግብ" description="የመምህሩን መረጃዎች እዚህ ይሙሉ">
      <TeacherForm role="ADMIN" cancelHref={`${base}/teachers`} onSuccessHref={`${base}/teachers`} />
    </TelegramFormShell>
  )
}
