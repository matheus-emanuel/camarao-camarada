import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'

export default async function PortalFarmsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user!.id)
    .single()

  const { data: farms } = await supabase
    .from('farms')
    .select('*, ponds(count)')
    .eq('client_id', client?.id ?? '')
    .order('name')

  return (
    <div>
      <PageHeader title="Minhas Fazendas" />

      {!farms?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🌾</p>
          <p className="text-sm">Nenhuma fazenda cadastrada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {farms.map((farm) => {
            const pondCount = Array.isArray(farm.ponds) ? (farm.ponds[0] as { count: number })?.count ?? 0 : 0
            return (
              <Link key={farm.id} href={`/portal/farms/${farm.id}`}>
                <div className="bg-white rounded-xl border border-gray-200 hover:border-ocean-300 hover:shadow-sm transition-all p-5 cursor-pointer h-full">
                  <h3 className="font-semibold text-gray-800 mb-1">{farm.name}</h3>
                  {(farm.city || farm.state) && (
                    <p className="text-sm text-gray-500">{[farm.city, farm.state].filter(Boolean).join(', ')}</p>
                  )}
                  {farm.area_ha && (
                    <p className="text-xs text-gray-400 mt-1">{farm.area_ha} ha</p>
                  )}
                  <p className="text-xs text-ocean-600 font-medium mt-3">
                    {pondCount} viveiro{pondCount !== 1 ? 's' : ''} →
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
