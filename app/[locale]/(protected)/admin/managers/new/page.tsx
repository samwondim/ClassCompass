import { TelegramFormShell } from '@/components/telegram-form-shell'
import { ManagerForm } from '@/components/forms/manager-form'

export default function AdminNewManagerPage({ params }: { params: { locale: string } }) {
  const base = `/${params.locale}/admin`
  return (
    <TelegramFormShell title="አዲስ አስተዳዳሪ" description="የአስተዳዳሪውን መረጃዎች እዚህ ይሙሉ">
      <ManagerForm cancelHref={`${base}/managers`} onSuccessHref={`${base}/managers`} />
    </TelegramFormShell>
  )
}
