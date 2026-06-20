import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAlertEmail } from '@/lib/email/resend'

export async function POST(_request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'lab_admin') {
    return NextResponse.json({ error: 'Sem permissão.' }, { status: 403 })
  }

  try {
    await sendAlertEmail({
      to: user.email!,
      clientName: 'Usuário Teste',
      pondName: 'Viveiro 01',
      farmName: 'Fazenda Teste',
      collectedAt: new Date().toLocaleDateString('pt-BR'),
      alertedParams: [
        { name: 'pH', value: '9.2', unit: null, ref_min: 7.5, ref_max: 8.5 },
        { name: 'Amônia Total (TAN)', value: '1.5', unit: 'mg/L', ref_min: null, ref_max: 1.0 },
      ],
      analysisId: 'test-00000000-0000-0000-0000-000000000000',
    })

    return NextResponse.json({ success: true, message: `E-mail de teste enviado para ${user.email}` })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
