import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkAlerts, hasAnyAlert } from '@/lib/alerts/checker'
import type { Parameter } from '@/types/app'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*, analysis_results(*, parameters(*))')
    .eq('id', params.id)
    .single()

  if (!analysis) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 })

  return NextResponse.json({ analysis })
}

const ResultSchema = z.object({
  parameter_id: z.string().uuid(),
  value: z.number().nullable(),
  value_text: z.string().nullable().optional(),
})

const AnalysisUpdateSchema = z.object({
  collected_at: z.string().datetime(),
  analyzed_at: z.string().datetime().nullable().optional(),
  technician: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  results: z.array(ResultSchema).min(1, 'Informe ao menos um resultado.'),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'lab_admin') {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = AnalysisUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { collected_at, analyzed_at, technician, notes, results } = parsed.data

  const { data: parameters } = await supabase
    .from('parameters')
    .select('*')
    .in('id', results.map((r) => r.parameter_id))

  const checkedResults = checkAlerts(results, (parameters ?? []) as Parameter[])
  const alertsFound = hasAnyAlert(checkedResults)

  const { data: analysis, error: updateError } = await supabase
    .from('analyses')
    .update({
      collected_at,
      analyzed_at: analyzed_at ?? null,
      technician: technician ?? null,
      notes: notes ?? null,
      has_alerts: alertsFound,
    })
    .eq('id', params.id)
    .select()
    .single()

  if (updateError || !analysis) {
    return NextResponse.json({ error: updateError?.message ?? 'Erro ao atualizar análise.' }, { status: 500 })
  }

  const { error: deleteError } = await supabase.from('analysis_results').delete().eq('analysis_id', params.id)
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const { error: resultsError } = await supabase.from('analysis_results').insert(
    checkedResults.map((r) => ({
      analysis_id: params.id,
      parameter_id: r.parameter_id,
      value: r.value,
      value_text: r.value_text ?? null,
      is_alert: r.is_alert,
    }))
  )

  if (resultsError) {
    return NextResponse.json({ error: resultsError.message }, { status: 500 })
  }

  return NextResponse.json({ analysis })
}
