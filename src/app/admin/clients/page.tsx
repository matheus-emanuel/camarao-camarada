import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { formatDate } from '@/lib/utils'

export default async function AdminClientsPage() {
  const supabase = createClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('*, farms(count)')
    .order('created_at', { ascending: false })

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`${clients?.length ?? 0} clientes cadastrados`}
        actions={
          <Link
            href="/admin/clients/new"
            className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Novo cliente
          </Link>
        }
      />

      {!clients?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-sm">Nenhum cliente cadastrado ainda.</p>
          <Link href="/admin/clients/new" className="text-sm text-ocean-600 hover:underline mt-2 inline-block">
            Cadastrar primeiro cliente →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">E-mail</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Cadastrado em</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{c.company_name ?? '—'}</p>
                    <p className="text-xs text-gray-500 sm:hidden">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 text-center hidden md:table-cell">
                    {formatDate(c.created_at)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      c.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {c.active ? 'Ativo' : 'Inativo'}
                    </span>
                    {!c.user_id && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 ml-1">
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/clients/${c.id}`} className="text-sm text-ocean-600 hover:underline">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
