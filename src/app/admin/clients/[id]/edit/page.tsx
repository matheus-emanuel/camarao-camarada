import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { ClientForm } from '@/components/clients/client-form'

export default async function EditClientPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!client) notFound()

  return (
    <div>
      <PageHeader
        title="Editar cliente"
        breadcrumb={[
          { label: 'Clientes', href: '/admin/clients' },
          { label: client.company_name ?? client.email, href: `/admin/clients/${params.id}` },
          { label: 'Editar' },
        ]}
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ClientForm defaultValues={client} submitLabel="Salvar alterações" />
      </div>
    </div>
  )
}
