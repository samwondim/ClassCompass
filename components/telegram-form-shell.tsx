'use client'

import { ReactNode } from 'react'

interface TelegramFormShellProps {
  title: string
  description?: string
  children: ReactNode
}

export function TelegramFormShell({ title, description, children }: TelegramFormShellProps) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-28 pt-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="divide-y divide-border">{children}</div>
      </div>
    </div>
  )
}
