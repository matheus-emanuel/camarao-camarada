import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { FarmForm } from '@/components/farms/farm-form'
import { formatDate } from '@/lib/utils'

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*, farms(*, ponds(count))')
    .eq('id', params.id)
    .single()

  if (!client) notFound()

  const farms = (client.farms as { id: string; name: string; city: string | null; state: string | null; area_ha: number | null; created_at: string }[]) ?? []

  return (
    <div>
      <PageHeader
        title={client.company_name ?? client.email}
        description={client.email}
        breadcrumb={[
          { label: 'Clientes', href: '/admin/clients' },
          { label: client.company_name ?? client.email },
        ]}
        actions={
          <div className="flex gap-2">
            {!client.user_id && (
              <button
                onClick={async () => {
                  'use server'
                }}
                className="px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                Reenviar convite
              </button>
            )}
            <Link
              href={`/admin/clients/${params.id}/edit`}
              className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Editar
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Dados do cliente</h2>
            <dl className="space-y-3">
              {client.document && (
                <div>
                  <dt className="text-xs text-gray-500">CPF/CNPJ</dt>
                  <dd className="text-sm text-gray-800 font-medium">{client.document}</dd>
                </div>
              )}
              {client.phone && (
                <div>
                  <dt className="text-xs text-gray-500">Telefone</dt>
                  <dd className="text-sm text-gray-800">{client.phone}</dd>
                </div>
              )}
              {(client.city || client.state) && (
                <div>
                  <dt className="text-xs text-gray-500">Localização</dt>
                  <dd className="text-sm text-gray-800">
                    {[client.city, client.state].filter(Boolean).join(', ')}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-gray-500">Cadastrado em</dt>
                <dd className="text-sm text-gray-800">{formatDate(client.created_at)}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Acesso ao portal</dt>
                <dd>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${client.user_id ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {client.user_id ? 'Ativo' : 'Convite pendente'}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Fazendas</h2>
              <span className="text-xs text-gray-400">{farms.length} fazenda(s)</span>
            </div>

            {farms.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma fazenda cadastrada.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {farms.map((farm) => (
                  <div key={farm.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{farm.name}</p>
                      <p className="text-xs text-gray-500">
                        {[farm.city, farm.state].filter(Boolean).join(', ')}
                        {farm.area_ha ? ` · ${farm.area_ha} ha` : ''}
                      </p>
                    </div>
                    <Link href={`/admin/farms/${farm.id}`} className="text-sm text-ocean-600 hover:underline">
                      Ver viveiros →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Adicionar fazenda</h2>
            <FarmForm clientId={params.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
