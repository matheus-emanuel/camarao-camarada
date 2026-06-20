import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AlertBadge } from '@/components/shared/alert-badge'
import { formatDate } from '@/lib/utils'

export default async function PortalDashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from('clients')
    .select('id, company_name, email')
    .eq('user_id', user!.id)
    .single()

  if (!client) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-4xl mb-3">🦐</p>
        <p className="text-sm">Seu cadastro ainda está sendo configurado pelo laboratório.</p>
      </div>
    )
  }

  const { data: ponds } = await supabase
    .from('ponds')
    .select('*, farms!inner(client_id, name), last_analysis:analyses(id, collected_at, has_alerts)')
    .eq('farms.client_id', client.id)
    .eq('active', true)
    .order('collected_at', { ascending: false, foreignTable: 'last_analysis' })
    .limit(1, { foreignTable: 'last_analysis' })

  const { data: recentAlerts } = await supabase
    .from('analyses')
    .select('id, collected_at, ponds!inner(name, farms!inner(client_id, name))')
    .eq('ponds.farms.client_id', client.id)
    .eq('has_alerts', true)
    .order('collected_at', { ascending: false })
    .limit(5)

  return (
    <div>
      <PageHeader
        title={`Olá, ${client.company_name ?? client.email}!`}
        description="Painel de monitoramento da qualidade da água"
      />

      {ponds && ponds.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Seus viveiros</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ponds.map((pond) => {
              const farm = pond.farms as { client_id: string; name: string }
              const lastAnalysis = Array.isArray(pond.last_analysis) ? pond.last_analysis[0] : null
              return (
                <Link key={pond.id} href={`/portal/ponds/${pond.id}`}>
                  <div className="bg-white rounded-xl border border-gray-200 hover:border-ocean-300 hover:shadow-sm transition-all p-5 cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-800 text-sm">{pond.name}</p>
                      {lastAnalysis && (
                        <AlertBadge hasAlerts={lastAnalysis.has_alerts} />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{farm.name}</p>
                    {lastAnalysis && (
                      <p className="text-xs text-gray-400 mt-2">
                        Última análise: {formatDate(lastAnalysis.collected_at)}
                      </p>
                    )}
                    {!lastAnalysis && (
                      <p className="text-xs text-gray-400 mt-2">Sem análises ainda</p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {recentAlerts && recentAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide mb-3">⚠ Alertas recentes</h2>
          <div className="space-y-2">
            {recentAlerts.map((a) => {
              const pond = a.ponds as { name: string; farms: { client_id: string; name: string } }
              return (
                <div key={a.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-red-100">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{pond.name} — {pond.farms.name}</p>
                    <p className="text-xs text-gray-500">{formatDate(a.collected_at)}</p>
                  </div>
                  <Link href={`/portal/analyses/${a.id}`} className="text-sm text-ocean-600 hover:underline shrink-0">
                    Ver →
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {(!ponds?.length && !recentAlerts?.length) && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌊</p>
          <p className="text-sm">Aguardando as primeiras análises do laboratório.</p>
        </div>
      )}
    </div>
  )
}
