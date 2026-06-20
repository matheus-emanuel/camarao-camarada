import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { checkAlerts, hasAnyAlert } from '@/lib/alerts/checker'
import { sendAlertEmail } from '@/lib/email/resend'
import { formatDate } from '@/lib/utils'
import type { Parameter } from '@/types/app'

const ResultSchema = z.object({
  parameter_id: z.string().uuid(),
  value: z.number().nullable(),
  value_text: z.string().nullable().optional(),
})

const AnalysisSchema = z.object({
  pond_id: z.string().uuid(),
  collected_at: z.string().datetime(),
  analyzed_at: z.string().datetime().nullable().optional(),
  technician: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  results: z.array(ResultSchema).min(1, 'Informe ao menos um resultado.'),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'lab_admin') {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = AnalysisSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { pond_id, collected_at, analyzed_at, technician, notes, results } = parsed.data

  const { data: parameters } = await supabase
    .from('parameters')
    .select('*')
    .in('id', results.map((r) => r.parameter_id))

  const checkedResults = checkAlerts(results, (parameters ?? []) as Parameter[])
  const alertsFound = hasAnyAlert(checkedResults)

  const { data: analysis, error: insertError } = await supabase
    .from('analyses')
    .insert({
      pond_id,
      collected_at,
      analyzed_at: analyzed_at ?? null,
      technician: technician ?? null,
      notes: notes ?? null,
      has_alerts: alertsFound,
      created_by: user.id,
    })
    .select()
    .single()

  if (insertError || !analysis) {
    return NextResponse.json({ error: insertError?.message ?? 'Erro ao criar análise.' }, { status: 500 })
  }

  const { error: resultsError } = await supabase.from('analysis_results').insert(
    checkedResults.map((r) => ({
      analysis_id: analysis.id,
      parameter_id: r.parameter_id,
      value: r.value,
      value_text: r.value_text ?? null,
      is_alert: r.is_alert,
    }))
  )

  if (resultsError) {
    console.error('[analyses] Error inserting results:', resultsError)
  }

  if (alertsFound) {
    const { data: pondData } = await supabase
      .from('ponds')
      .select('name, farms(name, clients(id, email, company_name))')
      .eq('id', pond_id)
      .single()

    if (pondData) {
      const farm = pondData.farms as { name: string; clients: { id: string; email: string; company_name: string | null } }
      const client = farm.clients
      const alertedParams = checkedResults
        .filter((r) => r.is_alert)
        .map((r) => {
          const param = (parameters ?? []).find((p) => p.id === r.parameter_id)
          return {
            name: param?.name ?? r.parameter_id,
            value: r.value !== null ? String(r.value) : r.value_text ?? '—',
            unit: param?.unit ?? null,
            ref_min: param?.ref_min ?? null,
            ref_max: param?.ref_max ?? null,
          }
        })

      sendAlertEmail({
        to: client.email,
        clientName: client.company_name ?? client.email,
        pondName: pondData.name,
        farmName: farm.name,
        collectedAt: formatDate(collected_at, "dd/MM/yyyy 'às' HH:mm"),
        alertedParams,
        analysisId: analysis.id,
      })
        .then(() =>
          supabase.from('notifications').insert({
            analysis_id: analysis.id,
            client_id: client.id,
            type: 'alert',
            recipient_email: client.email,
            success: true,
          })
        )
        .catch((err) => {
          console.error('[Alert Email]', err)
          supabase.from('notifications').insert({
            analysis_id: analysis.id,
            client_id: client.id,
            type: 'alert',
            recipient_email: client.email,
            success: false,
            error_message: String(err),
          })
        })
    }
  }

  return NextResponse.json({ analysis }, { status: 201 })
}
