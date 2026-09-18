export function ScheduleDateBadge({ date, className = '' }: { date: Date | string; className?: string }) {
  const d = new Date(date)
  const day = d.toLocaleDateString('en-US', { day: 'numeric' })
  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()

  return (
    <div
      className={`flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-secondary ${className}`}
    >
      <span className="text-[13px] font-bold leading-none text-primary">{day}</span>
      <span className="mt-0.5 text-[9px] leading-none text-primary">{month}</span>
    </div>
  )
}
