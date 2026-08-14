import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ParameterUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  unit: z.string().optional().nullable(),
  category: z.enum(['campo', 'laboratorio', 'microbiologico', 'contaminantes']).optional(),
  ref_min: z.number().optional().nullable(),
  ref_max: z.number().optional().nullable(),
  method: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  active: z.boolean().optional(),
})

async function requireLabAdmin(supabase: ReturnType<typeof createClient>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) } as const

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'lab_admin') {
    return { error: NextResponse.json({ error: 'Sem permissão.' }, { status: 403 }) } as const
  }

  return { user } as const
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const auth = await requireLabAdmin(supabase)
  if ('error' in auth) return auth.error

  const body = await request.json()
  const parsed = ParameterUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { data: parameter, error } = await supabase
    .from('parameters')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('created_by', auth.user.id)
    .select()
    .single()

  if (error || !parameter) {
    return NextResponse.json({ error: error?.message ?? 'Parâmetro não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({ parameter })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const auth = await requireLabAdmin(supabase)
  if ('error' in auth) return auth.error

  const { data: existing } = await supabase
    .from('parameters')
    .select('id')
    .eq('id', params.id)
    .eq('created_by', auth.user.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Parâmetro não encontrado.' }, { status: 404 })
  }

  const { data: usage } = await supabase
    .from('analysis_results')
    .select('id')
    .eq('parameter_id', params.id)
    .limit(1)

  if (usage && usage.length > 0) {
    return NextResponse.json(
      { error: 'Este parâmetro já foi usado em análises e não pode ser excluído. Desative-o em vez disso.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('parameters').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
