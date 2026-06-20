'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Farm } from '@/types/app'

interface FarmFormProps {
  clientId: string
  defaultValues?: Partial<Farm>
  submitLabel?: string
}

export function FarmForm({ clientId, defaultValues = {}, submitLabel = 'Salvar fazenda' }: FarmFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      client_id: clientId,
      name: (form.querySelector('#name') as HTMLInputElement).value,
      location: (form.querySelector('#location') as HTMLInputElement).value,
      city: (form.querySelector('#city') as HTMLInputElement).value,
      state: (form.querySelector('#state') as HTMLInputElement).value,
      area_ha: parseFloat((form.querySelector('#area_ha') as HTMLInputElement).value) || null,
    }

    const isEditing = !!defaultValues.id
    const url = isEditing ? `/api/farms/${defaultValues.id}` : '/api/farms'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Erro ao salvar fazenda.')
      setLoading(false)
      return
    }

    router.back()
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome da fazenda <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          defaultValue={defaultValues.name ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
          placeholder="Fazenda Boa Vista"
        />
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
          Localização / Referência
        </label>
        <input
          id="location"
          type="text"
          defaultValue={defaultValues.location ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
          placeholder="Estrada CE-040, km 12"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
          <input
            id="city"
            type="text"
            defaultValue={defaultValues.city ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="Aracati"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">UF</label>
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

      <div>
        <label htmlFor="area_ha" className="block text-sm font-medium text-gray-700 mb-1">
          Área total (ha)
        </label>
        <input
          id="area_ha"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaultValues.area_ha ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
          placeholder="10.5"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <div className="flex gap-3 pt-2">
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
