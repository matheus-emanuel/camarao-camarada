'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/portal/farms', label: 'Minhas Fazendas', icon: '🌾' },
  { href: '/portal/compare', label: 'Comparar Análises', icon: '📈' },
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
        <div className="text-xl font-bold">🦐 Camarão Camarada</div>
        <div className="text-xs text-ocean-300 mt-1">Portal do Cliente</div>
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
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-ocean-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-ocean-200 hover:bg-ocean-800 hover:text-white transition-colors"
        >
          <span>🚪</span> Sair
        </button>
      </div>
    </aside>
  )
}
