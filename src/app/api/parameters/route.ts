import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ParameterSchema = z.object({
  name: z.string().min(1),
  unit: z.string().optional().nullable(),
  category: z.enum(['campo', 'laboratorio', 'microbiologico', 'contaminantes']),
  ref_min: z.number().optional().nullable(),
  ref_max: z.number().optional().nullable(),
  method: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
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
  const parsed = ParameterSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { data: parameter, error } = await supabase
    .from('parameters')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ parameter }, { status: 201 })
}
