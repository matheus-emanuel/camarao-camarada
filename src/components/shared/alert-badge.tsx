import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AlertBadgeProps {
  hasAlerts: boolean
  alertCount?: number
  className?: string
}

export function AlertBadge({ hasAlerts, alertCount = 0, className }: AlertBadgeProps) {
  if (!hasAlerts) {
    return (
      <Badge variant="success" className={cn(className)}>
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        Normal
      </Badge>
    )
  }
  if (alertCount >= 3) {
    return (
      <Badge variant="critical" className={cn(className)}>
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
        {alertCount} alertas
      </Badge>
    )
  }
  return (
    <Badge variant="warning" className={cn(className)}>
      <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
      {alertCount} alerta{alertCount > 1 ? 's' : ''}
    </Badge>
  )
}
