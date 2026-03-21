
'use client'

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function AdminDashboard() {
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "am"
  const base = `/${locale}/admin`

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-sky-700 mb-4">እንኳን ደህና መጡ</h1>


      <Card>
        <CardHeader>
          <CardTitle>ፈጣን ማስተካከያ</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row justify-center">
          <div className="grid grid-cols-1 gap-3">
            <div className="grid grid-cols-3 gap-3">
              <Link href={`${base}/teachers/new`}>
                <Button variant="secondary">ተጠቃሚዎች መዝግብ</Button>
              </Link>
              <Link href={`${base}/courses/new`}>
                <Button variant="secondary">ትምህርት መዝግብ</Button>
              </Link>
              <Link href={`${base}/sections/new`}>
                <Button variant="secondary">ክፍል መዝግብ</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}
