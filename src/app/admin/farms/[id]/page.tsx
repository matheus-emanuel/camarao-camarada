import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { PondForm } from '@/components/ponds/pond-form'

export default async function FarmDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: farm } = await supabase
    .from('farms')
    .select('*, clients(id, company_name, email), ponds(*)')
    .eq('id', params.id)
    .single()

  if (!farm) notFound()

  const client = farm.clients as { id: string; company_name: string | null; email: string }
  const ponds = (farm.ponds as { id: string; name: string; area_m2: number | null; system_type: string | null; active: boolean }[]) ?? []

  return (
    <div>
      <PageHeader
        title={farm.name}
        description={`${client.company_name ?? client.email}${farm.area_ha ? ` · ${farm.area_ha} ha` : ''}`}
        breadcrumb={[
          { label: 'Clientes', href: '/admin/clients' },
          { label: client.company_name ?? client.email, href: `/admin/clients/${client.id}` },
          { label: farm.name },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Viveiros</h2>
              <span className="text-xs text-gray-400">{ponds.length} viveiro(s)</span>
            </div>

            {ponds.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Nenhum viveiro cadastrado.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {ponds.map((pond) => (
                  <div key={pond.id} className="px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{pond.name}</p>
                      <p className="text-xs text-gray-500">
                        {pond.system_type ?? 'Sistema não definido'}
                        {pond.area_m2 ? ` · ${pond.area_m2.toLocaleString('pt-BR')} m²` : ''}
                        {!pond.active && ' · Inativo'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/analyses/new?pond=${pond.id}`} className="text-xs text-ocean-600 hover:underline">
                        Nova análise
                      </Link>
                      <Link href={`/admin/ponds/${pond.id}`} className="text-sm text-ocean-600 hover:underline">
                        Ver →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Adicionar viveiro</h2>
            <PondForm farmId={params.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
