import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AnalysisForm } from '@/components/analyses/analysis-form'

export default async function EditAnalysisPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: analysis }, { data: ponds }, { data: parameters }] = await Promise.all([
    supabase
      .from('analyses')
      .select('*, analysis_results(*), ponds(name, farms(name, clients(company_name, email)))')
      .eq('id', params.id)
      .single(),
    supabase
      .from('ponds')
      .select('*, farms(id, name, clients(company_name, email))')
      .eq('active', true)
      .order('name'),
    supabase
      .from('parameters')
      .select('*')
      .eq('active', true)
      .order('display_order'),
  ])

  if (!analysis) notFound()

  const pond = analysis.ponds as unknown as { name: string; farms: { name: string; clients: { company_name: string | null; email: string } } }
  const clientName = pond.farms.clients.company_name ?? pond.farms.clients.email

  return (
    <div>
      <PageHeader
        title="Editar análise"
        description={`${pond.farms.name} · ${pond.name} · ${clientName}`}
        breadcrumb={[
          { label: 'Análise', href: `/admin/analyses/${params.id}` },
          { label: 'Editar' },
        ]}
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AnalysisForm
          ponds={(ponds ?? []) as Parameters<typeof AnalysisForm>[0]['ponds']}
          parameters={parameters ?? []}
          analysisId={params.id}
          defaultValues={{
            pond_id: analysis.pond_id,
            collected_at: analysis.collected_at,
            analyzed_at: analysis.analyzed_at,
            technician: analysis.technician,
            notes: analysis.notes,
            results: analysis.analysis_results,
          }}
        />
      </div>
    </div>
  )
}
