'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'
import type { Parameter, Pond } from '@/types/app'

interface AnalysisFormDefaults {
  pond_id: string
  collected_at: string
  analyzed_at?: string | null
  technician?: string | null
  notes?: string | null
  results: { parameter_id: string; value: number | null; value_text: string | null }[]
}

interface AnalysisFormProps {
  ponds: (Pond & { farms: { id: string; name: string; clients: { company_name: string | null; email: string } } })[]
  parameters: Parameter[]
  analysisId?: string
  defaultValues?: AnalysisFormDefaults
}

function isOutOfRange(param: Parameter, rawValue: string): boolean {
  const value = parseFloat(rawValue)
  if (rawValue === '' || isNaN(value)) return false
  const belowMin = param.ref_min !== null && value < param.ref_min
  const aboveMax = param.ref_max !== null && value > param.ref_max
  return belowMin || aboveMax
}

function toLocalInput(iso: string) {
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function AnalysisForm({ ponds, parameters, analysisId, defaultValues }: AnalysisFormProps) {
  const router = useRouter()
  const isEditing = !!analysisId
  const [step, setStep] = useState(1)
  const [selectedPondId, setSelectedPondId] = useState(defaultValues?.pond_id ?? '')
  const [collectedAt, setCollectedAt] = useState(
    defaultValues ? toLocalInput(defaultValues.collected_at) : new Date().toISOString().slice(0, 16)
  )
  const [analyzedAt, setAnalyzedAt] = useState(
    defaultValues?.analyzed_at ? toLocalInput(defaultValues.analyzed_at) : ''
  )
  const [technician, setTechnician] = useState(defaultValues?.technician ?? '')
  const [notes, setNotes] = useState(defaultValues?.notes ?? '')
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const r of defaultValues?.results ?? []) {
      initial[r.parameter_id] = r.value !== null ? String(r.value) : r.value_text ?? ''
    }
    return initial
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const activeParameters = parameters.filter((p) => p.active)

  function handleValueChange(parameterId: string, value: string) {
    setValues((prev) => ({ ...prev, [parameterId]: value }))
  }

  async function handleSubmit() {
    if (!selectedPondId) {
      setError('Selecione um viveiro.')
      return
    }
    setLoading(true)
    setError('')

    const results = activeParameters
      .filter((p) => values[p.id] !== undefined && values[p.id] !== '')
      .map((p) => ({
        parameter_id: p.id,
        value: isNaN(parseFloat(values[p.id])) ? null : parseFloat(values[p.id]),
        value_text: isNaN(parseFloat(values[p.id])) ? values[p.id] : null,
      }))

    const url = isEditing ? `/api/analyses/${analysisId}` : '/api/analyses'
    const method = isEditing ? 'PATCH' : 'POST'
    const payload: Record<string, unknown> = {
      collected_at: new Date(collectedAt).toISOString(),
      analyzed_at: analyzedAt ? new Date(analyzedAt).toISOString() : null,
      technician: technician || null,
      notes: notes || null,
      results,
    }
    if (!isEditing) payload.pond_id = selectedPondId

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.error ?? 'Erro ao salvar análise.')
      setLoading(false)
      return
    }

    const { analysis } = await res.json()
    toast({
      variant: 'success',
      title: isEditing ? 'Análise atualizada' : 'Análise registrada',
      description: isEditing
        ? 'Os resultados foram corrigidos com sucesso.'
        : 'Os resultados foram salvos e o cliente será notificado se houver alertas.',
    })
    router.push(`/admin/analyses/${analysis.id}`)
    router.refresh()
  }

  const categoryGroups: Record<string, Parameter[]> = {}
  for (const p of activeParameters) {
    if (!categoryGroups[p.category]) categoryGroups[p.category] = []
    categoryGroups[p.category].push(p)
  }

  const categoryLabels: Record<string, string> = {
    campo: 'Campo',
    laboratorio: 'Laboratório',
    microbiologico: 'Microbiológico',
    contaminantes: 'Contaminantes',
  }

  return (
    <div className="max-w-3xl">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s ? 'bg-ocean-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}
            >
              {s}
            </div>
            <span className={`text-sm ${step >= s ? 'text-ocean-700 font-medium' : 'text-gray-400'}`}>
              {s === 1 ? 'Dados gerais' : 'Parâmetros'}
            </span>
            {s < 2 && <span className="text-gray-300 mx-1">→</span>}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Viveiro <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPondId}
              onChange={(e) => setSelectedPondId(e.target.value)}
              required
              disabled={isEditing}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
            >
              <option value="">Selecionar viveiro</option>
              {ponds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.farms.name} ({p.farms.clients.company_name ?? p.farms.clients.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data/hora da coleta <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data/hora da análise
              </label>
              <input
                type="datetime-local"
                value={analyzedAt}
                onChange={(e) => setAnalyzedAt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analista responsável</label>
            <input
              type="text"
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500"
              placeholder="Nome do técnico"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 resize-none"
              placeholder="Condições do viveiro, observações relevantes..."
            />
          </div>

          <button
            onClick={() => {
              if (!selectedPondId) { setError('Selecione um viveiro.'); return }
              setError('')
              setStep(2)
            }}
            className="px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Próximo → Inserir parâmetros
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {Object.entries(categoryGroups).map(([cat, params]) => (
            <div key={cat}>
              <h3 className="text-sm font-semibold text-ocean-700 uppercase tracking-wider mb-3 pb-1 border-b border-ocean-100">
                {categoryLabels[cat] ?? cat}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {params.map((p) => {
                  const outOfRange = isOutOfRange(p, values[p.id] ?? '')
                  return (
                    <div key={p.id}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {p.name}
                        {p.unit && <span className="text-gray-400 ml-1">({p.unit})</span>}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={values[p.id] ?? ''}
                        onChange={(e) => handleValueChange(p.id, e.target.value)}
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 font-mono',
                          outOfRange
                            ? 'border-red-400 bg-red-50 focus:ring-red-400'
                            : 'border-gray-300 focus:ring-ocean-500'
                        )}
                        placeholder={p.ref_min !== null || p.ref_max !== null
                          ? `ref: ${p.ref_min ?? '—'} – ${p.ref_max ?? '—'}`
                          : ''}
                      />
                      {outOfRange && (
                        <p className="text-xs text-red-600 mt-1">Fora da faixa de referência</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setStep(1); setError('') }}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              ← Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {loading ? (
                isEditing ? 'Salvando...' : 'Registrando...'
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {isEditing ? 'Salvar alterações' : 'Registrar análise'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
