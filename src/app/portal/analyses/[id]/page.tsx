import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AlertBadge } from '@/components/shared/alert-badge'
import { AnalysisResultsTable } from '@/components/analyses/analysis-results-table'
import { AnalysisPdfLayout } from '@/components/analyses/analysis-pdf-layout'
import { PdfDownloadButton } from '@/components/shared/pdf-download-button'
import { formatDateTime } from '@/lib/utils'

export default async function PortalAnalysisDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: analysis } = await supabase
    .from('analyses')
    .select(`
      *,
      analysis_results(*, parameters(*)),
      ponds(name, farms(name, clients(company_name, email)))
    `)
    .eq('id', params.id)
    .single()

  if (!analysis) notFound()

  const pond = analysis.ponds as { name: string; farms: { name: string; clients: { company_name: string | null; email: string } } }
  const results = analysis.analysis_results as Parameters<typeof AnalysisResultsTable>[0]['results']
  const alertCount = results.filter((r) => r.is_alert).length
  const clientName = pond.farms.clients.company_name ?? pond.farms.clients.email

  return (
    <div>
      <AnalysisPdfLayout
        analysis={{ ...analysis, analysis_results: results } as Parameters<typeof AnalysisPdfLayout>[0]['analysis']}
        pondName={pond.name}
        farmName={pond.farms.name}
        clientName={clientName}
      />

      <PageHeader
        title={`Análise — ${pond.name}`}
        description={`${pond.farms.name} · ${formatDateTime(analysis.collected_at)}`}
        breadcrumb={[
          { label: 'Fazendas', href: '/portal/farms' },
          { label: pond.farms.name, href: '' },
          { label: pond.name, href: `/portal/ponds/${analysis.pond_id}` },
          { label: 'Análise' },
        ]}
        actions={
          <div className="flex gap-2 items-center">
            <AlertBadge hasAlerts={analysis.has_alerts} alertCount={alertCount} />
            <PdfDownloadButton
              elementId="pdf-content"
              filename={`analise-${params.id.slice(0, 8)}.pdf`}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Data da coleta', value: formatDateTime(analysis.collected_at) },
          { label: 'Analista', value: analysis.technician ?? '—' },
          { label: 'Parâmetros analisados', value: `${results.length}` },
          { label: 'Alertas', value: alertCount > 0 ? `${alertCount} parâmetro(s)` : 'Nenhum' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {analysis.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <p className="text-xs text-gray-500 mb-1">Observações do laboratório</p>
          <p className="text-sm text-gray-700">{analysis.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Resultados</h2>
          <Link
            href={`/portal/compare?a=${params.id}`}
            className="text-xs text-ocean-600 hover:underline"
          >
            Comparar com outra análise →
          </Link>
        </div>
        <div className="p-5">
          <AnalysisResultsTable results={results} />
        </div>
      </div>
    </div>
  )
}
