import { cn } from '@/lib/utils'

interface AlertBadgeProps {
  hasAlerts: boolean
  alertCount?: number
  className?: string
}

export function AlertBadge({ hasAlerts, alertCount = 0, className }: AlertBadgeProps) {
  if (!hasAlerts) {
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200', className)}>
        ✓ Normal
      </span>
    )
  }
  if (alertCount >= 3) {
    return (
      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200', className)}>
        ⚠ {alertCount} alertas
      </span>
    )
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200', className)}>
      ⚠ {alertCount} alerta{alertCount > 1 ? 's' : ''}
    </span>
  )
}
