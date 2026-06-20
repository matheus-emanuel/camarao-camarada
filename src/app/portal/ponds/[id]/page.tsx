'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/page-header'
import { AnalysisTable } from '@/components/analyses/analysis-table'
import { ParameterChart } from '@/components/charts/parameter-chart'
import type { Analysis, Parameter, ChartDataPoint } from '@/types/app'

interface AnalysisWithCount extends Analysis {
  alert_count: number
}

export default function PortalPondPage({ params }: { params: { id: string } }) {
  const [pond, setPond] = useState<{ name: string; farms: { name: string } } | null>(null)
  const [analyses, setAnalyses] = useState<AnalysisWithCount[]>([])
  const [parameters, setParameters] = useState<Parameter[]>([])
  const [selectedParamId, setSelectedParamId] = useState('')
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [{ data: pondData }, { data: analysesData }] = await Promise.all([
        supabase
          .from('ponds')
          .select('name, farms(name)')
          .eq('id', params.id)
          .single(),
        supabase
          .from('analyses')
          .select('*, analysis_results(count).filter(is_alert.eq.true)')
          .eq('pond_id', params.id)
          .order('collected_at', { ascending: false }),
      ])

      setPond(pondData as { name: string; farms: { name: string } })

      const withCount = (analysesData ?? []).map((a) => ({
        ...a,
        alert_count: Array.isArray(a.analysis_results)
          ? (a.analysis_results[0] as { count: number })?.count ?? 0
          : 0,
      }))
      setAnalyses(withCount)

      if (analysesData?.length) {
        const { data: params_ } = await supabase
          .from('parameters')
          .select('*')
          .eq('active', true)
          .order('display_order')
        setParameters(params_ ?? [])
        if (params_?.length) setSelectedParamId(params_[0].id)
      }

      setLoading(false)
    }
    load()
  }, [params.id])

  useEffect(() => {
    if (!selectedParamId || !analyses.length) return

    async function loadChart() {
      const supabase = createClient()
      const analysisIds = analyses.map((a) => a.id)

      const { data: results } = await supabase
        .from('analysis_results')
        .select('value, is_alert, analyses!inner(collected_at)')
        .eq('parameter_id', selectedParamId)
        .in('analysis_id', analysisIds)
        .order('analyses.collected_at', { ascending: true })

      const points: ChartDataPoint[] = (results ?? [])
        .filter((r) => r.value !== null)
        .map((r) => ({
          collected_at: (r.analyses as { collected_at: string }).collected_at,
          value: r.value!,
          is_alert: r.is_alert,
        }))

      setChartData(points)
    }

    loadChart()
  }, [selectedParamId, analyses])

  if (loading) {
    return <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Carregando...</div>
  }

  const selectedParam = parameters.find((p) => p.id === selectedParamId)

  return (
    <div>
      <PageHeader
        title={pond?.name ?? 'Viveiro'}
        description={pond?.farms?.name}
        breadcrumb={[
          { label: 'Fazendas', href: '/portal/farms' },
          { label: pond?.farms?.name ?? '', href: '' },
          { label: pond?.name ?? '' },
        ]}
      />

      {analyses.length > 0 && parameters.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Evolução temporal</h2>
            <select
              value={selectedParamId}
              onChange={(e) => setSelectedParamId(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean-500"
            >
              {parameters.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {chartData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              Sem dados para {selectedParam?.name ?? 'este parâmetro'}.
            </p>
          ) : (
            <ParameterChart
              data={chartData}
              parameterName={selectedParam?.name ?? ''}
              unit={selectedParam?.unit ?? null}
              refMin={selectedParam?.ref_min ?? null}
              refMax={selectedParam?.ref_max ?? null}
            />
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Histórico de análises ({analyses.length})
          </h2>
        </div>
        <div className="p-5">
          <AnalysisTable analyses={analyses} basePath="/portal/analyses" />
        </div>
      </div>
    </div>
  )
}
