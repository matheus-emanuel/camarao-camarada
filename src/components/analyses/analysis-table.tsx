import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { AlertBadge } from '@/components/shared/alert-badge'
import type { Analysis } from '@/types/app'

interface AnalysisWithCount extends Analysis {
  alert_count?: number
}

interface AnalysisTableProps {
  analyses: AnalysisWithCount[]
  basePath: string
}

export function AnalysisTable({ analyses, basePath }: AnalysisTableProps) {
  if (analyses.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        Nenhuma análise registrada ainda.
      </div>
    )
  }

  return (
    <div>
      {/* Desktop / tablet: full table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data Coleta</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Analista</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ação</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {analyses.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                  {formatDate(a.collected_at, "dd/MM/yyyy 'às' HH:mm")}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{a.technician ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  <AlertBadge hasAlerts={a.has_alerts} alertCount={a.alert_count ?? 0} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`${basePath}/${a.id}`} className="text-sm text-ocean-600 hover:text-ocean-800 font-medium">
                    Ver detalhes →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-2">
        {analyses.map((a) => (
          <Link
            key={a.id}
            href={`${basePath}/${a.id}`}
            className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 transition-colors ${
              a.has_alerts ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
            }`}
          >
            <div>
              <p className="text-sm font-medium text-gray-800">
                {formatDate(a.collected_at, "dd/MM/yyyy 'às' HH:mm")}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{a.technician ?? 'Analista não informado'}</p>
              <div className="mt-1.5">
                <AlertBadge hasAlerts={a.has_alerts} alertCount={a.alert_count ?? 0} />
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  )
}
