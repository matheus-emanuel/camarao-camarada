import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AnalysisForm } from '@/components/analyses/analysis-form'

export default async function NewAnalysisPage() {
  const supabase = createClient()

  const [{ data: ponds }, { data: parameters }] = await Promise.all([
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

  return (
    <div>
      <PageHeader
        title="Nova análise"
        description="Registrar resultados de análise de qualidade da água"
        breadcrumb={[{ label: 'Análises' }, { label: 'Nova' }]}
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AnalysisForm
          ponds={(ponds ?? []) as Parameters<typeof AnalysisForm>[0]['ponds']}
          parameters={parameters ?? []}
        />
      </div>
    </div>
  )
}
