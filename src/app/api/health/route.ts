import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createAdminClient()
    await supabase.from('parameters').select('id').limit(1)
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() })
  } catch (error) {
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 })
  }
}
