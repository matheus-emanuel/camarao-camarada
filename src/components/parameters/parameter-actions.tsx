'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'

interface ParameterActionsProps {
  id: string
  name: string
  active: boolean
}

export function ParameterActions({ id, name, active }: ParameterActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function toggleActive() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/parameters/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Erro ao atualizar parâmetro.')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    setError('')
    const res = await fetch(`/api/parameters/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Erro ao excluir parâmetro.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <button
        onClick={toggleActive}
        disabled={loading}
        className="text-xs font-medium text-ocean-600 hover:underline disabled:opacity-50"
      >
        {active ? 'Desativar' : 'Ativar'}
      </button>
      <ConfirmDialog
        title="Excluir parâmetro"
        description={`Tem certeza que deseja excluir "${name}"? Só é possível excluir parâmetros que nunca foram usados em análises.`}
        confirmLabel="Excluir"
        variant="danger"
        onConfirm={handleDelete}
      >
        <button className="text-gray-400 hover:text-red-600 transition-colors" aria-label={`Excluir ${name}`}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </ConfirmDialog>
    </div>
  )
}
