import { UnitsList } from '@/components/units/units-list'

export default async function AdminUnitsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <UnitsList role="admin" locale={locale} />
}
