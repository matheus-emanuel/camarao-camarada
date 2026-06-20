'use client'

import { useState } from 'react'
import { formatDate, formatValue, cn } from '@/lib/utils'
import type { Analysis, AnalysisResult, Parameter } from '@/types/app'

interface ResultWithParam extends AnalysisResult {
  parameters: Parameter
}

interface AnalysisWithResults extends Analysis {
  analysis_results: ResultWithParam[]
}

interface AnalysisCompareProps {
  analyses: Analysis[]
}

export function AnalysisCompare({ analyses }: AnalysisCompareProps) {
  const [leftId, setLeftId] = useState('')
  const [rightId, setRightId] = useState('')
  const [leftData, setLeftData] = useState<AnalysisWithResults | null>(null)
  const [rightData, setRightData] = useState<AnalysisWithResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function loadAnalysis(id: string): Promise<AnalysisWithResults | null> {
    const res = await fetch(`/api/pdf/${id}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.analysis
  }

  async function handleCompare() {
    if (!leftId || !rightId) { setError('Selecione duas análises.'); return }
    if (leftId === rightId) { setError('Selecione análises diferentes.'); return }
    setLoading(true)
    setError('')

    const [left, right] = await Promise.all([loadAnalysis(leftId), loadAnalysis(rightId)])

    if (!left || !right) {
      setError('Erro ao carregar análises.')
      setLoading(false)
      return
    }

    setLeftData(left)
    setRightData(right)
    setLoading(false)
  }

  const allParams = leftData?.analysis_results.map((r) => r.parameters) ?? []

  function getResult(data: AnalysisWithResults | null, parameterId: string) {
    return data?.analysis_results.find((r) => r.parameter_id === parameterId) ?? null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Análise A</label>
          <select
            value={leftId}
            onChange={(e) => setLeftId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white"
          >
            <option value="">Selecionar análise</option>
            {analyses.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === rightId}>
                {formatDate(a.collected_at, "dd/MM/yyyy 'às' HH:mm")}
                {a.has_alerts ? ' ⚠' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Análise B</label>
          <select
            value={rightId}
            onChange={(e) => setRightId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white"
          >
            <option value="">Selecionar análise</option>
            {analyses.map((a) => (
              <option key={a.id} value={a.id} disabled={a.id === leftId}>
                {formatDate(a.collected_at, "dd/MM/yyyy 'às' HH:mm")}
                {a.has_alerts ? ' ⚠' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading}
          className="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
        >
          {loading ? 'Carregando...' : 'Comparar'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {leftData && rightData && (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Parâmetro</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-ocean-600 uppercase">
                  A — {formatDate(leftData.collected_at, 'dd/MM/yyyy')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-seagreen-700 uppercase">
                  B — {formatDate(rightData.collected_at, 'dd/MM/yyyy')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Delta</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {allParams.map((p) => {
                const left = getResult(leftData, p.id)
                const right = getResult(rightData, p.id)
                const leftVal = left?.value ?? null
                const rightVal = right?.value ?? null
                const delta = leftVal !== null && rightVal !== null ? rightVal - leftVal : null
                const deltaStr = delta !== null
                  ? `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`
                  : '—'
                const deltaColor = delta === null ? 'text-gray-400' : delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-gray-500'

                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{p.name}</td>
                    <td className={cn('px-4 py-3 text-sm text-center font-mono', left?.is_alert ? 'text-red-700 font-bold' : 'text-gray-700')}>
                      {leftVal !== null ? formatValue(leftVal, p.unit) : left?.value_text ?? '—'}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-center font-mono', right?.is_alert ? 'text-red-700 font-bold' : 'text-gray-700')}>
                      {rightVal !== null ? formatValue(rightVal, p.unit) : right?.value_text ?? '—'}
                    </td>
                    <td className={cn('px-4 py-3 text-sm text-center font-mono', deltaColor)}>
                      {deltaStr}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
