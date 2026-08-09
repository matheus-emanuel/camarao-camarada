import { CheckCircle2, Lightbulb, TriangleAlert } from 'lucide-react'
import { cn, formatValue, categoryLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ParameterInfoToggle } from './parameter-info-toggle'
import type { AnalysisResult, Parameter } from '@/types/app'

interface ResultRow extends AnalysisResult {
  parameters: Parameter
}

interface AnalysisResultsTableProps {
  results: ResultRow[]
}

const categoryOrder = ['campo', 'laboratorio', 'microbiologico', 'contaminantes']

function refLabel({ ref_min, ref_max, unit }: Parameter) {
  if (ref_min !== null && ref_max !== null) return `${ref_min} – ${ref_max}${unit ? ` ${unit}` : ''}`
  if (ref_max !== null) return `≤ ${ref_max}${unit ? ` ${unit}` : ''}`
  if (ref_min !== null) return `≥ ${ref_min}${unit ? ` ${unit}` : ''}`
  return '—'
}

function StatusPill({ isAlert }: { isAlert: boolean }) {
  return isAlert ? (
    <Badge variant="critical">
      <TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
      Alerta
    </Badge>
  ) : (
    <Badge variant="success">
      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
      OK
    </Badge>
  )
}

function ParameterName({ row }: { row: ResultRow }) {
  if (row.is_alert || !row.parameters.description) {
    return <span>{row.parameters.name}</span>
  }
  return <ParameterInfoToggle name={row.parameters.name} description={row.parameters.description} />
}

function GuidanceCallout({ row }: { row: ResultRow }) {
  const guidance =
    row.parameters.description ||
    'Este resultado está fora da faixa de referência. Entre em contato com o laboratório para orientações específicas sobre este viveiro.'
  return (
    <div className="mt-2 flex gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-900">
      <Lightbulb className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
      <p>
        <span className="font-semibold">O que fazer: </span>
        {guidance}
      </p>
    </div>
  )
}

export function AnalysisResultsTable({ results }: AnalysisResultsTableProps) {
  const sorted = [...results].sort((a, b) => {
    const catDiff =
      categoryOrder.indexOf(a.parameters.category) - categoryOrder.indexOf(b.parameters.category)
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
    <div>
      {/* Desktop / tablet: full table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
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
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      className={cn('transition-colors', r.is_alert ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50')}
                    >
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium align-top">
                        <ParameterName row={r} />
                        {r.is_alert && <GuidanceCallout row={r} />}
                      </td>
                      <td className={cn('px-4 py-3 text-sm text-right font-mono align-top', r.is_alert ? 'text-red-700 font-bold' : 'text-gray-700')}>
                        {r.value !== null ? formatValue(r.value, r.parameters.unit) : r.value_text ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 text-center align-top">{refLabel(r.parameters)}</td>
                      <td className="px-4 py-3 text-center align-top">
                        <StatusPill isAlert={r.is_alert} />
                      </td>
                    </tr>
                  ))}
                </>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-4">
        {categoryOrder.map((cat) => {
          const rows = grouped[cat]
          if (!rows?.length) return null
          return (
            <div key={`cat-mobile-${cat}`}>
              <h3 className="px-1 pb-2 text-xs font-semibold text-ocean-700 uppercase tracking-wider">
                {categoryLabel(cat)}
              </h3>
              <div className="space-y-2">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className={cn(
                      'rounded-lg border px-3 py-3',
                      r.is_alert ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          <ParameterName row={r} />
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">Referência: {refLabel(r.parameters)}</p>
                      </div>
                      <StatusPill isAlert={r.is_alert} />
                    </div>
                    <p className={cn('mt-2 text-lg font-mono', r.is_alert ? 'text-red-700 font-bold' : 'text-gray-700')}>
                      {r.value !== null ? formatValue(r.value, r.parameters.unit) : r.value_text ?? '—'}
                    </p>
                    {r.is_alert && <GuidanceCallout row={r} />}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
