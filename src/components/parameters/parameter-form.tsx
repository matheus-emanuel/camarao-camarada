'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Parameter } from '@/types/app'

const categories = [
  { value: 'campo', label: 'Campo' },
  { value: 'laboratorio', label: 'Laboratório' },
  { value: 'microbiologico', label: 'Microbiológico' },
  { value: 'contaminantes', label: 'Contaminantes' },
]

interface ParameterFormProps {
  defaultValues?: Partial<Parameter>
  onSuccess?: () => void
  submitLabel?: string
}

export function ParameterForm({ defaultValues = {}, onSuccess, submitLabel = 'Salvar parâmetro' }: ParameterFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const form = e.currentTarget
    const data = {
      name: (form.querySelector('#name') as HTMLInputElement).value,
      unit: (form.querySelector('#unit') as HTMLInputElement).value || null,
      category: (form.querySelector('#category') as HTMLSelectElement).value,
      ref_min: parseFloat((form.querySelector('#ref_min') as HTMLInputElement).value) || null,
      ref_max: parseFloat((form.querySelector('#ref_max') as HTMLInputElement).value) || null,
      method: (form.querySelector('#method') as HTMLInputElement).value || null,
      description: (form.querySelector('#description') as HTMLTextAreaElement).value || null,
    }

    const isEditing = !!defaultValues.id
    const url = isEditing ? `/api/parameters/${defaultValues.id}` : '/api/parameters'
    const method = isEditing ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Erro ao salvar parâmetro.')
      setLoading(false)
      return
    }

    if (onSuccess) {
      onSuccess()
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            defaultValue={defaultValues.name ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="Temperatura"
          />
        </div>

        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
          <input
            id="unit"
            type="text"
            defaultValue={defaultValues.unit ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="°C, mg/L, ppt..."
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Categoria <span className="text-red-500">*</span>
          </label>
          <select
            id="category"
            required
            defaultValue={defaultValues.category ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white"
          >
            <option value="">Selecionar</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ref_min" className="block text-sm font-medium text-gray-700 mb-1">Ref. Mínimo</label>
          <input
            id="ref_min"
            type="number"
            step="any"
            defaultValue={defaultValues.ref_min ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="Ex: 7.5"
          />
        </div>

        <div>
          <label htmlFor="ref_max" className="block text-sm font-medium text-gray-700 mb-1">Ref. Máximo</label>
          <input
            id="ref_max"
            type="number"
            step="any"
            defaultValue={defaultValues.ref_max ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="Ex: 8.5"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">Método de análise</label>
          <input
            id="method"
            type="text"
            defaultValue={defaultValues.method ?? ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
            placeholder="Colorimetria / Espectrofotometria"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
          <textarea
            id="description"
            defaultValue={defaultValues.description ?? ''}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? 'Salvando...' : submitLabel}
      </button>
    </form>
  )
}
