import Link from 'next/link'
import { Sprout, Waves, TriangleAlert } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
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

  const [{ count: farmCount }, { data: ponds }, { data: recentAnalyses }] = await Promise.all([
    supabase.from('farms').select('*', { count: 'exact', head: true }).eq('client_id', client.id),
    supabase
      .from('ponds')
      .select('*, farms!inner(client_id), last_analysis:analyses(has_alerts, collected_at)')
      .eq('farms.client_id', client.id)
      .eq('active', true)
      .order('collected_at', { ascending: false, foreignTable: 'last_analysis' })
      .limit(1, { foreignTable: 'last_analysis' }),
    supabase
      .from('analyses')
      .select('id, collected_at, has_alerts, ponds!inner(id, name, farms!inner(client_id, name)), analysis_results(count)')
      .eq('ponds.farms.client_id', client.id)
      .order('collected_at', { ascending: false })
      .limit(5),
  ])

  const pondCount = ponds?.length ?? 0
  const alertCount = ponds?.filter((p) => {
    const last = Array.isArray(p.last_analysis) ? p.last_analysis[0] : null
    return last?.has_alerts
  }).length ?? 0

  const hasData = pondCount > 0 || (recentAnalyses?.length ?? 0) > 0

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Bem-vindo, ${client.company_name ?? client.email}`}
      />

      {!hasData ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌊</p>
          <p className="text-sm">Aguardando as primeiras análises do laboratório.</p>
          <p className="text-xs text-gray-400 mt-1">O laboratório costuma registrar novas análises periodicamente — volte em alguns dias.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Fazendas Monitoradas</p>
                <div className="bg-ocean-50 p-2 rounded-[10px]">
                  <Sprout className="h-5 w-5 text-ocean-600" aria-hidden="true" />
                </div>
              </div>
              <p className="text-stat text-gray-900 text-3xl">{farmCount ?? 0} Fazendas</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Viveiros Ativos</p>
                <div className="bg-ocean-50 p-2 rounded-[10px]">
                  <Waves className="h-5 w-5 text-ocean-600" aria-hidden="true" />
                </div>
              </div>
              <p className="text-stat text-gray-900 text-3xl">{pondCount} Viveiros</p>
            </div>

            <div className={`bg-white rounded-2xl border-2 p-6 ${alertCount > 0 ? 'border-red-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Alertas Ativos</p>
                <div className="bg-red-50 p-2 rounded-[10px]">
                  <TriangleAlert className="h-5 w-5 text-red-700" aria-hidden="true" />
                </div>
              </div>
              <p className="text-stat text-gray-900 text-3xl">{alertCount} Alertas</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-heading font-bold text-lg text-gray-900 mb-5">Últimas Análises</h2>

            {!recentAnalyses?.length ? (
              <p className="text-sm text-gray-400 text-center py-10">Nenhuma análise registrada ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Fazenda</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Viveiro</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Data</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">Parâmetros</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 w-[120px]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAnalyses.map((a) => {
                      const pond = a.ponds as unknown as { id: string; name: string; farms: { name: string } }
                      const paramCount = Array.isArray(a.analysis_results)
                        ? (a.analysis_results[0] as { count: number } | undefined)?.count ?? 0
                        : 0
                      return (
                        <tr key={a.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm font-medium text-gray-800">{pond.farms.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">
                            <Link href={`/portal/ponds/${pond.id}`} className="hover:text-ocean-600 hover:underline">
                              {pond.name}
                            </Link>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-500">{formatDate(a.collected_at)}</td>
                          <td className="px-4 py-4 text-sm text-gray-500">{paramCount} analisados</td>
                          <td className="px-4 py-4">
                            <Badge variant={a.has_alerts ? 'critical' : 'success'}>
                              {a.has_alerts ? 'ALERTA' : 'OK'}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
