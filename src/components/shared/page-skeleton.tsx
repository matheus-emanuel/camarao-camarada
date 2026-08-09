import { Skeleton } from '@/components/ui/skeleton'

type PageSkeletonVariant = 'grid' | 'table' | 'detail' | 'form'

export function PageSkeleton({ variant }: { variant: PageSkeletonVariant }) {
  if (variant === 'grid') {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 border-b border-gray-100 last:border-0" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'detail') {
    return (
      <div>
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 rounded-xl mb-4" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-md" />
        ))}
      </div>
    </div>
  )
}
