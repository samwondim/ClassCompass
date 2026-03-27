import { TelegramFormShell } from '@/components/telegram-form-shell'
import { TeacherForm } from '@/components/forms/teacher-form'

export default function ManagerNewTeacherPage({ params }: { params: { locale: string } }) {
  const base = `/${params.locale}/manager`
  return (
    <TelegramFormShell title="መምህር መዝግብ" description="የመምህሩን መረጃዎች እዚህ ይሙሉ">
      <TeacherForm role="MANAGER" cancelHref={`${base}/teachers`} onSuccessHref={`${base}/teachers`} />
    </TelegramFormShell>
  )
}
