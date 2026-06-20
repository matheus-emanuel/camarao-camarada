'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Pond } from '@/types/app'

const systemTypes = [
  { value: 'extensivo', label: 'Extensivo' },
  { value: 'semi-intensivo', label: 'Semi-intensivo' },
  { value: 'intensivo', label: 'Intensivo' },
  { value: 'bioflocos', label: 'Bioflocos' },
]

interface PondFormProps {
  farmId: string
  defaultValues?: Partial<Pond>
  submitLabel?: string
}

export function PondForm({ farmId, defaultValues = {}, submitLabel = 'Salvar viveiro' }: PondFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      farm_id: farmId,
      name: (form.querySelector('#name') as HTMLInputElement).value,
      area_m2: parseFloat((form.querySelector('#area_m2') as HTMLInputElement).value) || null,
      depth_m: parseFloat((form.querySelector('#depth_m') as HTMLInputElement).value) || null,
      species: (form.querySelector('#species') as HTMLInputElement).value,
      system_type: (form.querySelector('#system_type') as HTMLSelectElement).value || null,
    }

    const isEditing = !!defaultValues.id
    const url = isEditing ? `/api/ponds/${defaultValues.id}` : '/api/ponds'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Erro ao salvar viveiro.')
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
          Nome do viveiro <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          defaultValue={defaultValues.name ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
          placeholder="Viveiro 01"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="area_m2" className="block text-sm font-medium text-gray-700 mb-1">
            Área (m²)
          </label>
          <input
            id="area_m2"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues.area_m2 ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="5000"
          />
        </div>
        <div>
          <label htmlFor="depth_m" className="block text-sm font-medium text-gray-700 mb-1">
            Profundidade (m)
          </label>
          <input
            id="depth_m"
            type="number"
            step="0.1"
            min="0"
            defaultValue={defaultValues.depth_m ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="1.2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">
          Espécie
        </label>
        <input
          id="species"
          type="text"
          defaultValue={defaultValues.species ?? 'Litopenaeus vannamei'}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
        />
      </div>

      <div>
        <label htmlFor="system_type" className="block text-sm font-medium text-gray-700 mb-1">
          Sistema de cultivo
        </label>
        <select
          id="system_type"
          defaultValue={defaultValues.system_type ?? ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white"
        >
          <option value="">Selecionar sistema</option>
          {systemTypes.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
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
