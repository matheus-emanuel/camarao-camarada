import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
  className?: string
}

export function PageHeader({ title, description, actions, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-2">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span>/</span>}
              {item.href ? (
                <a href={item.href} className="hover:text-ocean-600 transition-colors">
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-400">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  )
}
