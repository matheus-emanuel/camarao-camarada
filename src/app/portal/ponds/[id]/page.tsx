'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/shared/page-header'
import { PageSkeleton } from '@/components/shared/page-skeleton'
import { ParameterChart } from '@/components/charts/parameter-chart'
import { Badge } from '@/components/ui/badge'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { formatDate, formatValue, formatReferenceRange } from '@/lib/utils'
import type { Analysis, Parameter, ChartDataPoint } from '@/types/app'

export default function PortalPondPage({ params }: { params: { id: string } }) {
  const [pond, setPond] = useState<{ name: string; farms: { name: string } } | null>(null)
  const [analyses, setAnalyses] = useState<Analysis[]>([])
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
          .select('*')
          .eq('pond_id', params.id)
          .order('collected_at', { ascending: false }),
      ])

      setPond(pondData as { name: string; farms: { name: string } })
      setAnalyses(analysesData ?? [])

      if (analysesData?.length) {
        const { data: params_ } = await supabase
          .from('parameters')
          .select('*')
          .eq('active', true)
          .order('display_order')
        setParameters(params_ ?? [])

        const mostRecentAnalysisId = analysesData[0].id
        const { data: alerted } = await supabase
          .from('analysis_results')
          .select('parameter_id, parameters!inner(display_order)')
          .eq('analysis_id', mostRecentAnalysisId)
          .eq('is_alert', true)
          .order('display_order', { foreignTable: 'parameters', ascending: true })
          .limit(1)

        const defaultParamId = alerted?.[0]?.parameter_id ?? params_?.[0]?.id
        if (defaultParamId) setSelectedParamId(defaultParamId)
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
        .order('collected_at', { foreignTable: 'analyses', ascending: true })

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
    return <PageSkeleton variant="detail" />
  }

  const selectedParam = parameters.find((p) => p.id === selectedParamId)

  const referenceLabel = selectedParam
    ? formatReferenceRange(selectedParam.ref_min, selectedParam.ref_max, selectedParam.unit)
    : '—'

  return (
    <div>
      <PageHeader
        title={pond?.name ?? 'Viveiro'}
        description={pond?.farms?.name ? `${pond.farms.name} — Monitoramento individual de parâmetros` : undefined}
        breadcrumb={[
          { label: 'Fazendas', href: '/portal/farms' },
          { label: pond?.farms?.name ?? '', href: '' },
          { label: pond?.name ?? '' },
        ]}
        actions={
          parameters.length > 0 && (
            <Select value={selectedParamId} onValueChange={setSelectedParamId}>
              <SelectTrigger className="w-auto min-w-[200px] bg-white">
                <SelectValue placeholder="Selecionar parâmetro" />
              </SelectTrigger>
              <SelectContent>
                {parameters.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }
      />

      {analyses.length > 0 && parameters.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Evolução temporal{selectedParam?.unit ? ` (${selectedParam.unit})` : ''}
          </h2>

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
            Histórico de Análises — {selectedParam?.name ?? 'Parâmetro'}
          </h2>
        </div>

        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Nenhum dado registrado para este parâmetro.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor Medido</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Referência</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[120px]">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {[...chartData].reverse().map((point, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{formatDate(point.collected_at)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatValue(point.value, selectedParam?.unit ?? null)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{referenceLabel}</td>
                    <td className="px-4 py-3">
                      <Badge variant={point.is_alert ? 'critical' : 'success'}>
                        {point.is_alert ? 'ALERTA' : 'OK'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
