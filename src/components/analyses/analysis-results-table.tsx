import { cn, formatValue, categoryLabel } from '@/lib/utils'
import type { AnalysisResult, Parameter } from '@/types/app'

interface ResultRow extends AnalysisResult {
  parameters: Parameter
}

interface AnalysisResultsTableProps {
  results: ResultRow[]
}

const categoryOrder = ['campo', 'laboratorio', 'microbiologico', 'contaminantes']

export function AnalysisResultsTable({ results }: AnalysisResultsTableProps) {
  const sorted = [...results].sort((a, b) => {
    const catDiff =
      categoryOrder.indexOf(a.parameters.category) -
      categoryOrder.indexOf(b.parameters.category)
    if (catDiff !== 0) return catDiff
    return a.parameters.display_order - b.parameters.display_order
  })

  const grouped = sorted.reduce<Record<string, ResultRow[]>>((acc, r) => {
    const cat = r.parameters.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(r)
    return acc
  }, {})

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Parâmetro</th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Referência</th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {categoryOrder.map((cat) => {
            const rows = grouped[cat]
            if (!rows?.length) return null
            return (
              <>
                <tr key={`cat-${cat}`} className="bg-ocean-50">
                  <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-ocean-700 uppercase tracking-wider">
                    {categoryLabel(cat)}
                  </td>
                </tr>
                {rows.map((r) => {
                  const { ref_min, ref_max, unit } = r.parameters
                  const refLabel =
                    ref_min !== null && ref_max !== null
                      ? `${ref_min} – ${ref_max}${unit ? ` ${unit}` : ''}`
                      : ref_max !== null
                      ? `≤ ${ref_max}${unit ? ` ${unit}` : ''}`
                      : ref_min !== null
                      ? `≥ ${ref_min}${unit ? ` ${unit}` : ''}`
                      : '—'

                  return (
                    <tr
                      key={r.id}
                      className={cn(
                        'transition-colors',
                        r.is_alert ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {r.parameters.name}
                      </td>
                      <td className={cn('px-4 py-3 text-sm text-right font-mono', r.is_alert ? 'text-red-700 font-bold' : 'text-gray-700')}>
                        {r.value !== null
                          ? formatValue(r.value, r.parameters.unit)
                          : r.value_text ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 text-center">{refLabel}</td>
                      <td className="px-4 py-3 text-center">
                        {r.is_alert ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">⚠ Alerta</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ OK</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
