'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Sprout, LineChart, LogOut } from 'lucide-react'

const navItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/farms', label: 'Minhas Fazendas', icon: Sprout },
  { href: '/portal/compare', label: 'Comparar Análises', icon: LineChart },
]

export function PortalSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-ocean-900 text-white flex flex-col h-full">
      <div className="p-6 border-b border-ocean-800">
        <Image src="/logo-white.png" alt="Camarão Camarada" width={858} height={373} className="h-10 w-auto" priority />
        <div className="text-xs text-ocean-300 mt-2">Portal do Cliente</div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-ocean-700 text-white'
                : 'text-ocean-200 hover:bg-ocean-800 hover:text-white'
            )}
          >
            <item.icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-ocean-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ocean-200 hover:bg-ocean-800 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
        </button>
      </div>
    </aside>
  )
}
