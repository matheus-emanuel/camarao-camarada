import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { href: '#parametros', label: 'Parâmetros' },
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#precos', label: 'Preços' },
]

export function LandingNavbar() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between px-6 lg:px-20 h-20">
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="Camarão Camarada" width={856} height={371} className="h-12 w-auto" priority />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-[15px] font-medium text-slate-700">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-ocean-600 transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/login" className="text-[15px] font-semibold text-slate-900 hover:text-ocean-600 transition-colors">
            Entrar
          </Link>
          <Button asChild className="rounded-full px-6 hidden sm:inline-flex">
            <a href="mailto:contato@camaraocamarada.com.br">Falar com a Gente</a>
          </Button>
        </div>
      </div>
    </header>
  )
}
