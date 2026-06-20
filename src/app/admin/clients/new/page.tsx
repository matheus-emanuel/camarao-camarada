import { PageHeader } from '@/components/shared/page-header'
import { ClientForm } from '@/components/clients/client-form'

export default function NewClientPage() {
  return (
    <div>
      <PageHeader
        title="Novo cliente"
        breadcrumb={[
          { label: 'Clientes', href: '/admin/clients' },
          { label: 'Novo' },
        ]}
      />
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ClientForm submitLabel="Cadastrar cliente" />
      </div>
    </div>
  )
}
