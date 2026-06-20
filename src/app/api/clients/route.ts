import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const ClientSchema = z.object({
  email: z.string().email(),
  company_name: z.string().optional(),
  document: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const body = await request.json()
  const parsed = ClientSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { data: client, error } = await supabase
    .from('clients')
    .insert({ ...parsed.data, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/clients/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({
      client_id: client.id,
      email: client.email,
      full_name: client.company_name ?? client.email,
    }),
  }).catch((err) => console.error('[invite]', err))

  return NextResponse.json({ client }, { status: 201 })
}
