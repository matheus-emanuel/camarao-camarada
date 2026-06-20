import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/layout/admin-sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'lab_admin') redirect('/portal/dashboard')

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="hidden md:flex">
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden">
          <MobileNav role="lab_admin" />
        </div>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
