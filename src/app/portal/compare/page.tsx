import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AnalysisCompare } from '@/components/analyses/analysis-compare'

export default async function PortalComparePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, collected_at, has_alerts, ponds!inner(farm_id, farms!inner(client_id))')
    .eq('ponds.farms.client_id', client?.id ?? '')
    .order('collected_at', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Comparar Análises"
        description="Compare dois resultados lado a lado para ver a evolução"
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AnalysisCompare analyses={analyses ?? []} />
      </div>
    </div>
  )
}
