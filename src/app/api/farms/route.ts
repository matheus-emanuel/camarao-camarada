import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const FarmSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1),
  location: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().max(2).optional().nullable(),
  area_ha: z.number().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const parsed = FarmSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { data: farm, error } = await supabase
    .from('farms')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ farm }, { status: 201 })
}
