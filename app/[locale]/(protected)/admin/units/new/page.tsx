import { TelegramFormShell } from '@/components/telegram-form-shell'
import { UnitForm } from '@/components/forms/unit-form'

export default async function AdminNewUnitPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const base = `/${locale}/admin`
  return (
    <TelegramFormShell title="አዲስ ክፍለ-ጊዜ" description="አዲስ የትምህርት ክፍለ-ጊዜ ይመዝግቡ">
      <UnitForm cancelHref={`${base}/units`} onSuccessHref={`${base}/units`} />
    </TelegramFormShell>
  )
}
