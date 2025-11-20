// app/page.tsx
import { redirect } from 'next/navigation'
import prisma from '@/models/client'
import { getSession } from '@/utils/session'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Shield } from 'lucide-react'
import { LoginScreen } from '@/components/login-screen'

export default async function Home() {
  return <LoginScreen />
}
