import { redirect } from 'next/navigation'
import { getSession } from '@/utils/session'
import prisma from '@/models/client'
import Sidebar from '@/components/sidebar' // We'll create this next
import { AppLayout } from '@/components/app-layout'

export default async function ProtectedLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  const session = await getSession()
  if (!session) redirect(`/${locale}`)

  const user = await prisma.user.findUnique({
    where: { tg_username: session.fetched_user.tg_username },
  })

  if (!user) redirect(`/${locale}`) // Handle case where user doesn't exist

  const { user_role: role } = user

  // Optional: Add route-based role checks (e.g., only admins can access /admin/*)
  // You can get pathname via `import { usePathname } from 'next/navigation'` in a client component,
  // but for server-side, you'd need headers() or searchParams. For simplicity, rely on root redirects.

  return (
    <AppLayout userRole={role} >
      {children}
    </AppLayout>
  )
}
