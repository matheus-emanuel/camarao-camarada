import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
