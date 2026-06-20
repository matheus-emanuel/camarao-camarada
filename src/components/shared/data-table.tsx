import { cn } from '@/lib/utils'

interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => React.ReactNode)
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  emptyMessage?: string
  className?: string
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
    <div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
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
                  {typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : (row[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
