import { TelegramFormShell } from '@/components/telegram-form-shell'
import { SectionForm } from '@/components/forms/section-form'

export default async function AdminNewSectionPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const base = `/${locale}/admin`
  return (
    <TelegramFormShell title="አዲስ ክፍል" description="ክፍል ስም ያስገቡ">
      <SectionForm cancelHref={`${base}/sections`} onSuccessHref={`${base}/sections`} />
    </TelegramFormShell>
  )
}
