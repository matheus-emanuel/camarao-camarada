import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PortalSidebar } from '@/components/layout/portal-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'client') redirect('/admin/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden md:flex">
        <PortalSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
          <MobileNav role="client" />
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
