import { UnitsList } from '@/components/units/units-list'

export default async function ManagerUnitsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <UnitsList role="manager" locale={locale} />
}
