import { PageHeader } from '@/components/shared/page-header'

export default function AdminSettingsPage() {
  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Configurações do laboratório"
      />

      <div className="max-w-2xl space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">Laboratório</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do laboratório</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
                placeholder="Laboratório de Análise Aquícola"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de contato</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
                placeholder="lab@exemplo.com.br"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
                placeholder="(85) 3000-0000"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Salvar configurações
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">Testar envio de e-mail</h2>
          <p className="text-sm text-gray-500 mb-4">Envia um e-mail de teste para verificar a configuração do Resend.</p>
          <TestEmailButton />
        </div>
      </div>
    </div>
  )
}

function TestEmailButton() {
  return (
    <form action="/api/notifications/test" method="POST">
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-ocean-700 bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 rounded-lg transition-colors"
      >
        Enviar e-mail de teste
      </button>
    </form>
  )
}
