import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { looksLikeEmail, normalizeDocumentDigits, maskEmail } from '@/lib/auth/identifier'

const RequestSchema = z.object({ identifier: z.string().min(3) })

function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`)
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = RequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Informe um e-mail ou CPF válido.' }, { status: 400 })
  }

  const identifier = parsed.data.identifier.trim()
  const adminClient = createAdminClient()

  const query = adminClient.from('clients').select('id, email, company_name, user_id')
  const { data: client } = looksLikeEmail(identifier)
    ? await query.ilike('email', escapeLike(identifier)).maybeSingle()
    : await query.eq('document_digits', normalizeDocumentDigits(identifier)).maybeSingle()

  if (!client) {
    return NextResponse.json(
      { error: 'Cadastro não encontrado. Fale com o laboratório.' },
      { status: 404 }
    )
  }

  let userId = client.user_id

  if (!userId) {
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: client.email,
      email_confirm: true,
      user_metadata: { role: 'client', full_name: client.company_name ?? client.email },
    })

    if (createError || !created?.user) {
      console.error('[access-request] createUser failed', createError)
      return NextResponse.json({ error: 'Não foi possível iniciar o acesso.' }, { status: 500 })
    }

    const { error: linkError } = await adminClient
      .from('clients')
      .update({ user_id: created.user.id })
      .eq('id', client.id)

    if (linkError) {
      console.error('[access-request] linking clients.user_id failed', linkError)
      await adminClient.auth.admin.deleteUser(created.user.id)
      return NextResponse.json({ error: 'Não foi possível iniciar o acesso.' }, { status: 500 })
    }

    userId = created.user.id
  }

  const supabase = createClient()
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: client.email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/portal/dashboard`,
    },
  })

  if (otpError) {
    console.error('[access-request] signInWithOtp failed', otpError)
    return NextResponse.json({ error: 'Não foi possível enviar o link de acesso.' }, { status: 500 })
  }

  return NextResponse.json({ success: true, maskedEmail: maskEmail(client.email) })
}
