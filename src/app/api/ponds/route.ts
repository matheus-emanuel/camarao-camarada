import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const PondSchema = z.object({
  farm_id: z.string().uuid(),
  name: z.string().min(1),
  area_m2: z.number().optional().nullable(),
  depth_m: z.number().optional().nullable(),
  species: z.string().optional().nullable(),
  system_type: z.enum(['extensivo', 'semi-intensivo', 'intensivo', 'bioflocos']).optional().nullable(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const parsed = PondSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { data: pond, error } = await supabase
    .from('ponds')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ pond }, { status: 201 })
}
