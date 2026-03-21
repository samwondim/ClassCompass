import { TelegramFormShell } from '@/components/telegram-form-shell'
import { ScheduleForm } from '@/components/forms/schedule-form'

export default function ManagerNewSchedulePage({ params }: { params: { locale: string } }) {
  const base = `/${params.locale}/manager`
  return (
    <TelegramFormShell title="መርሃግብር መዝግብ" description="ቀን፣ ትምህርት እና መምህር ይምረጡ">
      <ScheduleForm cancelHref={`${base}/schedules`} onSuccessHref={`${base}/schedules`} />
    </TelegramFormShell>
  )
}
