'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  FlaskConical,
  TestTube2,
  Settings,
  Sprout,
  LineChart,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface MobileNavProps {
  role: 'lab_admin' | 'client'
}

const adminItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clientes', icon: Users },
  { href: '/admin/analyses/new', label: 'Nova Análise', icon: FlaskConical },
  { href: '/admin/parameters', label: 'Parâmetros', icon: TestTube2 },
  { href: '/admin/settings', label: 'Configurações', icon: Settings },
]

const portalItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/farms', label: 'Minhas Fazendas', icon: Sprout },
  { href: '/portal/compare', label: 'Comparar Análises', icon: LineChart },
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
    <div className="relative z-40 flex flex-col">
      <header className="relative bg-ocean-900 text-white px-4 py-3 flex items-center justify-between gap-3">
        <Link href={role === 'lab_admin' ? '/admin/dashboard' : '/portal/dashboard'} className="flex items-center gap-2 min-w-0">
          <Image src="/logo-icon-white.png" alt="Camarão Camarada" width={32} height={38} className="h-7 w-auto shrink-0" priority />
          <span className="font-heading font-bold text-base truncate">Camarão Camarada</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 rounded-lg hover:bg-ocean-800 transition-colors shrink-0"
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
        </button>
      </header>

      {open && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <nav className="relative z-40 bg-ocean-900 text-white w-full p-4 space-y-1 max-h-[calc(100vh-3rem)] overflow-y-auto">
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
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-ocean-200 hover:bg-ocean-800 hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
            </button>
          </nav>
        </>
      )}
    </div>
  )
}
