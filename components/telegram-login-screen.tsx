'use client'

import { useTelegram } from '@/components/telegram-provider'
import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'
import { Card, CardFooter, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function LoginScreen() {
  const { toast } = useToast()
  const { webApp, user } = useTelegram()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [phoneNumberInput, setPhoneNumberInput] = useState('')

  const authenticate = async (phone_number: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number }),
      })

      const data = await response.json()
      console.log('Frontend received data:', data)
      if (response.ok) {
        toast({ title: 'Success', description: `Welcome, ${data.teacher.name}!` })
        // Redirect based on role
        if (data.teacher.is_manager) {
          router.push('/manager')
        } else if (data.teacher.is_class_rep) {
          router.push('/representative')
        } else {
          router.push('/teacher')
        }
      } else {
        toast({ title: 'Error', description: data.error || 'Authentication failed', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to authenticate', variant: 'destructive' })
    }
    setLoading(false)
  }

  // Auto-authenticate if phone number is available
  useEffect(() => {
    if (user?.phone_number) {
      setPhoneNumberInput(user.phone_number)
      authenticate(user.phone_number)
    }
  }, [user])

  const handleLogin = () => {
    if (!phoneNumberInput) {
      toast({ title: 'Error', description: 'Please enter your phone number', variant: 'destructive' })
      return
    }
    authenticate(phoneNumberInput)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-sky-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-sky-100 p-3">
              <Shield className="h-8 w-8 text-sky-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-sky-700">ClassCompass</h1>
          <p className="text-sm text-slate-500 mt-2">Sunday School Scheduling Assistant</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className='flex flex-row justify-center'>Welcome</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="tel"
              placeholder="Enter your phone number"
              value={phoneNumberInput}
              onChange={(e) => setPhoneNumberInput(e.target.value)}
              className="mb-4"
            />
            <Button onClick={handleLogin} className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


