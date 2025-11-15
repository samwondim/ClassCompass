import { redirect } from 'next/navigation'
import prisma from '@/models/client'
import { getSession } from '@/utils/session'

export default async function Home() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { tg_username: session.user.tg_username },
  })

  if (user?.user_role === 'ADMIN') redirect('/admin')
  else if (user?.user_role === 'MANAGER') redirect('/manager')
  else if (user?.user_role === 'TEACHER') redirect('/teacher')

  return <div>Redirecting...</div>
}
