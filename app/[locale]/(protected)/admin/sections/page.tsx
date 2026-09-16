import Link from 'next/link';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getSections() {
  return await prisma.section.findMany({
    select: {
      section_id: true,
      section_name: true,
      manager: { select: { first_name: true, last_name: true } },
      _count: { select: { schedules: true, teacher_sections: true } },
    },
    orderBy: { section_name: 'asc' },
  });
}

export default async function AdminSectionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sections = await getSections();
  const base = `/${locale}/admin`;

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-2xl font-bold text-primary">ክፍሎች</h1>
        <Link href={`${base}/sections/new`} className="w-full sm:w-auto">
          <span className="inline-flex w-full sm:w-auto justify-center items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            አዲስ ክፍል
          </span>
        </Link>
      </div>

      {sections.length === 0 ? (
        <p className="text-muted-foreground">ክፍሎች አልተገኙም</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <div key={section.section_id} className="rounded-lg border bg-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold">{section.section_name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    አስተዳዳሪ: {section.manager ? `${section.manager.first_name} ${section.manager.last_name}` : '—'}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span>{section._count.schedules} መርሃ ግብሮች</span>
                <span>{section._count.teacher_sections} መምህራን</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
