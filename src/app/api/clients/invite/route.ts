import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const InviteSchema = z.object({
  client_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string().min(1),
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
  const parsed = InviteSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { client_id, email, full_name } = parsed.data

  const adminClient = createAdminClient()
  const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { role: 'client', full_name },
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/set-password`,
  })

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 })
  }

  if (inviteData?.user?.id) {
    await supabase
      .from('clients')
      .update({ user_id: inviteData.user.id })
      .eq('id', client_id)
  }

  return NextResponse.json({ success: true })
}
