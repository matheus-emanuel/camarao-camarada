import { cn } from '@/lib/utils'

interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
  /** Hide this column's label on the stacked mobile card (e.g. a column that's already the card title). */
  hideLabelOnMobile?: boolean
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  className?: string
}

function cellValue<T>(row: T, col: Column<T>) {
  return typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor] as React.ReactNode)
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyMessage = 'Nenhum registro encontrado.',
  className,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn('text-center py-12 text-gray-400 text-sm', className)}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Desktop / tablet: full table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                {columns.map((col, i) => (
                  <td key={i} className={cn('px-4 py-3 text-sm text-gray-700', col.className)}>
                    {cellValue(row, col)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards, one per row */}
      <div className="md:hidden space-y-2">
        {data.map((row) => (
          <div key={row.id} className="rounded-lg border border-gray-200 bg-white px-3 py-3 space-y-1.5">
            {columns.map((col, i) =>
              col.hideLabelOnMobile ? (
                <div key={i}>{cellValue(row, col)}</div>
              ) : (
                <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-xs font-medium text-gray-500 shrink-0">{col.header}</span>
                  <span className="text-gray-800 text-right">{cellValue(row, col)}</span>
                </div>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
