import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AlertBadge } from '@/components/shared/alert-badge'
import { formatDate } from '@/lib/utils'

export default async function AdminDashboardPage() {
  const supabase = createClient()

  const [
    { count: clientCount },
    { count: pondCount },
    { data: recentAnalyses },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase.from('ponds').select('*', { count: 'exact', head: true }).eq('active', true),
    supabase
      .from('analyses')
      .select('id, collected_at, has_alerts, ponds(name, farms(name, clients(company_name, email)))')
      .order('collected_at', { ascending: false })
      .limit(10),
  ])

  const alertCount = recentAnalyses?.filter((a) => a.has_alerts).length ?? 0

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral do laboratório"
        actions={
          <Link
            href="/admin/analyses/new"
            className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Nova Análise
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Clientes ativos</p>
          <p className="text-3xl font-bold text-ocean-700 mt-1">{clientCount ?? 0}</p>
          <Link href="/admin/clients" className="text-xs text-ocean-600 hover:underline mt-2 inline-block">Ver todos →</Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500">Viveiros ativos</p>
          <p className="text-3xl font-bold text-ocean-700 mt-1">{pondCount ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-5">
          <p className="text-sm text-gray-500">Alertas (últimas 10 análises)</p>
          <p className={`text-3xl font-bold mt-1 ${alertCount > 0 ? 'text-red-600' : 'text-seagreen-600'}`}>
            {alertCount}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">Análises recentes</h2>
          <Link href="/admin/analyses/new" className="text-sm text-ocean-600 hover:underline">Nova análise</Link>
        </div>

        {!recentAnalyses?.length ? (
          <p className="text-sm text-gray-400 text-center py-10">Nenhuma análise registrada ainda.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentAnalyses.map((a) => {
              const pond = a.ponds as { name: string; farms: { name: string; clients: { company_name: string | null; email: string } } } | null
              return (
                <div key={a.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {pond?.name ?? '—'} — {pond?.farms?.name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {pond?.farms?.clients?.company_name ?? pond?.farms?.clients?.email ?? '—'}
                      {' · '}
                      {formatDate(a.collected_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <AlertBadge hasAlerts={a.has_alerts} />
                    <Link href={`/admin/analyses/${a.id}`} className="text-sm text-ocean-600 hover:underline">
                      Ver →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
