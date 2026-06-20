import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AlertBadge } from '@/components/shared/alert-badge'
import { formatDate } from '@/lib/utils'

export default async function PortalFarmDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: farm } = await supabase
    .from('farms')
    .select('*, ponds(*, analyses(id, collected_at, has_alerts))')
    .eq('id', params.id)
    .eq('client_id', client?.id ?? '')
    .single()

  if (!farm) notFound()

  const ponds = (farm.ponds as {
    id: string
    name: string
    area_m2: number | null
    system_type: string | null
    analyses: { id: string; collected_at: string; has_alerts: boolean }[]
  }[]) ?? []

  return (
    <div>
      <PageHeader
        title={farm.name}
        description={[farm.city, farm.state].filter(Boolean).join(', ')}
        breadcrumb={[
          { label: 'Fazendas', href: '/portal/farms' },
          { label: farm.name },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ponds.map((pond) => {
          const analyses = pond.analyses ?? []
          const lastAnalysis = analyses[0]
          const hasRecentAlert = analyses.slice(0, 3).some((a) => a.has_alerts)

          return (
            <Link key={pond.id} href={`/portal/ponds/${pond.id}`}>
              <div className={`bg-white rounded-xl border hover:shadow-sm transition-all p-5 cursor-pointer h-full ${hasRecentAlert ? 'border-red-200 bg-red-50/30' : 'border-gray-200 hover:border-ocean-300'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{pond.name}</h3>
                  {lastAnalysis && <AlertBadge hasAlerts={lastAnalysis.has_alerts} />}
                </div>
                {pond.system_type && (
                  <p className="text-xs text-gray-500 capitalize">{pond.system_type}</p>
                )}
                {pond.area_m2 && (
                  <p className="text-xs text-gray-400">{pond.area_m2.toLocaleString('pt-BR')} m²</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {analyses.length > 0
                    ? `${analyses.length} análise${analyses.length !== 1 ? 's' : ''} · Última: ${formatDate(lastAnalysis.collected_at)}`
                    : 'Sem análises'}
                </p>
              </div>
            </Link>
          )
        })}
      </div>

      {ponds.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">Nenhum viveiro nesta fazenda.</p>
        </div>
      )}
    </div>
  )
}
