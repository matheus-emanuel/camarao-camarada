import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { AnalysisTable } from '@/components/analyses/analysis-table'

export default async function AdminPondPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const [{ data: pond }, { data: analyses }] = await Promise.all([
    supabase
      .from('ponds')
      .select('*, farms(id, name, clients(id, company_name, email))')
      .eq('id', params.id)
      .single(),
    supabase
      .from('analyses')
      .select('*, alert_count:analysis_results(count).filter(is_alert.eq.true)')
      .eq('pond_id', params.id)
      .order('collected_at', { ascending: false }),
  ])

  if (!pond) notFound()

  const farm = pond.farms as { id: string; name: string; clients: { id: string; company_name: string | null; email: string } }

  const analysesWithCount = (analyses ?? []).map((a) => ({
    ...a,
    alert_count: Array.isArray(a.alert_count) ? (a.alert_count[0] as { count: number })?.count ?? 0 : 0,
  }))

  return (
    <div>
      <PageHeader
        title={pond.name}
        description={`${farm.name} · ${farm.clients.company_name ?? farm.clients.email}`}
        breadcrumb={[
          { label: 'Clientes', href: '/admin/clients' },
          { label: farm.clients.company_name ?? farm.clients.email, href: `/admin/clients/${farm.clients.id}` },
          { label: farm.name, href: `/admin/farms/${farm.id}` },
          { label: pond.name },
        ]}
        actions={
          <Link
            href={`/admin/analyses/new?pond=${params.id}`}
            className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Nova análise
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Espécie', value: pond.species ?? '—' },
          { label: 'Sistema', value: pond.system_type ?? '—' },
          { label: 'Área', value: pond.area_m2 ? `${pond.area_m2.toLocaleString('pt-BR')} m²` : '—' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{item.label}</p>
            <p className="text-sm font-semibold text-gray-800 mt-1">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
            Histórico de análises ({analysesWithCount.length})
          </h2>
        </div>
        <div className="p-5">
          <AnalysisTable analyses={analysesWithCount} basePath="/admin/analyses" />
        </div>
      </div>
    </div>
  )
}
