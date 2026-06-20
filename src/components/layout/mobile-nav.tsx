'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  role: 'lab_admin' | 'client'
}

const adminItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/clients', label: 'Clientes', icon: '👥' },
  { href: '/admin/analyses/new', label: 'Nova Análise', icon: '🔬' },
  { href: '/admin/parameters', label: 'Parâmetros', icon: '⚗️' },
  { href: '/admin/settings', label: 'Configurações', icon: '⚙️' },
]

const portalItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/portal/farms', label: 'Minhas Fazendas', icon: '🌾' },
  { href: '/portal/compare', label: 'Comparar Análises', icon: '📈' },
]

export function MobileNav({ role }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const items = role === 'lab_admin' ? adminItems : portalItems

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    setOpen(false)
  }

  return (
    <>
      <header className="bg-ocean-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="font-bold text-lg">🦐 Camarão Camarada</div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-ocean-800 transition-colors"
          aria-label="Menu"
        >
          {open ? '✕' : '☰'}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 flex flex-col" style={{ top: '52px' }}>
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <nav className="relative bg-ocean-900 text-white w-full p-4 space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-ocean-700 text-white'
                    : 'text-ocean-200 hover:bg-ocean-800 hover:text-white'
                )}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-ocean-200 hover:bg-ocean-800 hover:text-white transition-colors"
            >
              <span>🚪</span> Sair
            </button>
          </nav>
        </div>
      )}
    </>
  )
}
