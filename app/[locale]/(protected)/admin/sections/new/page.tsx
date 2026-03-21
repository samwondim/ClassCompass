import { TelegramFormShell } from '@/components/telegram-form-shell'
import { SectionForm } from '@/components/forms/section-form'

export default function AdminNewSectionPage({ params }: { params: { locale: string } }) {
  const base = `/${params.locale}/admin`
  return (
    <TelegramFormShell title="አዲስ ክፍል" description="ክፍል ስም ያስገቡ">
      <SectionForm cancelHref={`${base}/teachers`} onSuccessHref={`${base}/teachers`} />
    </TelegramFormShell>
  )
}
