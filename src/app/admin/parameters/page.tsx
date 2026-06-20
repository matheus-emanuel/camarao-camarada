import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { ParameterForm } from '@/components/parameters/parameter-form'
import { categoryLabel } from '@/lib/utils'

export default async function ParametersPage() {
  const supabase = createClient()
  const { data: parameters } = await supabase
    .from('parameters')
    .select('*')
    .order('display_order')

  const categories = ['campo', 'laboratorio', 'microbiologico', 'contaminantes'] as const

  return (
    <div>
      <PageHeader
        title="Parâmetros"
        description={`${parameters?.length ?? 0} parâmetros configurados`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {categories.map((cat) => {
            const params = parameters?.filter((p) => p.category === cat) ?? []
            if (!params.length) return null
            return (
              <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-3 bg-ocean-50 border-b border-ocean-100">
                  <h2 className="text-sm font-semibold text-ocean-700">{categoryLabel(cat)}</h2>
                </div>
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Parâmetro</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unidade</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Ref. Min</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Ref. Max</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {params.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-800 font-medium">{p.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{p.unit ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center font-mono">{p.ref_min ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center font-mono">{p.ref_max ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-8">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Adicionar parâmetro</h2>
            <ParameterForm />
          </div>
        </div>
      </div>
    </div>
  )
}
