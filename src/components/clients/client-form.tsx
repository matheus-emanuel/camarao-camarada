'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Client } from '@/types/app'

interface ClientFormProps {
  defaultValues?: Partial<Client>
  submitLabel?: string
}

export function ClientForm({ defaultValues = {}, submitLabel = 'Salvar cliente' }: ClientFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      email: (form.querySelector('#email') as HTMLInputElement).value,
      company_name: (form.querySelector('#company_name') as HTMLInputElement).value,
      document: (form.querySelector('#document') as HTMLInputElement).value,
      phone: (form.querySelector('#phone') as HTMLInputElement).value,
      address: (form.querySelector('#address') as HTMLInputElement).value,
      city: (form.querySelector('#city') as HTMLInputElement).value,
      state: (form.querySelector('#state') as HTMLInputElement).value,
    }

    const isEditing = !!defaultValues.id
    const url = isEditing ? `/api/clients/${defaultValues.id}` : '/api/clients'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Erro ao salvar cliente.')
      setLoading(false)
      return
    }

    router.push('/admin/clients')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            defaultValue={defaultValues.email ?? ''}
            disabled={!!defaultValues.id}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 disabled:bg-gray-50 disabled:text-gray-500"
            placeholder="cliente@fazenda.com.br"
          />
          {!defaultValues.id && (
            <p className="text-xs text-gray-500 mt-1">O cliente receberá um convite para criar senha.</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome / Razão Social
          </label>
          <input
            id="company_name"
            type="text"
            defaultValue={defaultValues.company_name ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="Fazenda Boa Vista Ltda"
          />
        </div>

        <div>
          <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
            CPF / CNPJ
          </label>
          <input
            id="document"
            type="text"
            defaultValue={defaultValues.document ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="000.000.000-00"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <input
            id="phone"
            type="tel"
            defaultValue={defaultValues.phone ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="(85) 99999-0000"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Endereço
          </label>
          <input
            id="address"
            type="text"
            defaultValue={defaultValues.address ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="Rua das Fazendas, 123"
          />
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Cidade
          </label>
          <input
            id="city"
            type="text"
            defaultValue={defaultValues.city ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="Fortaleza"
          />
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            Estado (UF)
          </label>
          <input
            id="state"
            type="text"
            maxLength={2}
            defaultValue={defaultValues.state ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 uppercase"
            placeholder="CE"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {loading ? 'Salvando...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
