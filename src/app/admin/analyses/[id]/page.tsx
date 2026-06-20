import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AlertBadge } from '@/components/shared/alert-badge'
import { AnalysisResultsTable } from '@/components/analyses/analysis-results-table'
import { AnalysisPdfLayout } from '@/components/analyses/analysis-pdf-layout'
import { PdfDownloadButton } from '@/components/shared/pdf-download-button'
import { formatDateTime } from '@/lib/utils'

type AnalysisDetail = {
  id: string
  pond_id: string
  collected_at: string
  analyzed_at: string | null
  technician: string | null
  notes: string | null
  has_alerts: boolean
  created_at: string
  created_by: string
  analysis_results: Parameters<typeof AnalysisResultsTable>[0]['results']
  ponds: { name: string; farms: { name: string; clients: { company_name: string | null; email: string } } }
}

export default async function AdminAnalysisDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: raw } = await supabase
    .from('analyses')
    .select(`
      *,
      analysis_results(*, parameters(*)),
      ponds(name, farms(name, clients(company_name, email)))
    `)
    .eq('id', params.id)
    .single()

  if (!raw) notFound()
  const analysis = raw as unknown as AnalysisDetail

  const pond = analysis.ponds
  const results = analysis.analysis_results
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
        description={`${pond.farms.name} · ${clientName}`}
        breadcrumb={[
          { label: 'Dashboard', href: '/admin/dashboard' },
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
          { label: 'Data da análise', value: analysis.analyzed_at ? formatDateTime(analysis.analyzed_at) : '—' },
          { label: 'Analista', value: analysis.technician ?? '—' },
          { label: 'Parâmetros', value: `${results.length} medidos` },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      {analysis.notes && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <p className="text-xs text-gray-500 mb-1">Observações</p>
          <p className="text-sm text-gray-700">{analysis.notes}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Resultados</h2>
        </div>
        <div className="p-5">
          <AnalysisResultsTable results={results} />
        </div>
      </div>
    </div>
  )
}
