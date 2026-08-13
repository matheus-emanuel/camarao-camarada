import Image from 'next/image'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#parametros', label: 'Parâmetros' },
  { href: '#funcionalidades', label: 'Funcionalidades' },
  { href: '#beneficios', label: 'Benefícios' },
  { href: '#precos', label: 'Preços' },
]

export function LandingFooter() {
  return (
    <footer className="bg-[#0f172a] px-6 lg:px-20 pt-20 pb-10">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-16">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 justify-between">
          <div className="flex flex-col gap-5 max-w-sm">
            <Image src="/logo-white.png" alt="Camarão Camarada" width={168} height={92} className="h-11 w-auto self-start" />
            <p className="text-slate-400 text-sm leading-relaxed">
              Portal que conecta laboratórios de análise de água a produtores de camarão — leve os
              resultados de cada análise, o histórico e os alertas para o celular do seu cliente.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-heading font-semibold text-white text-base">Navegação</p>
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="text-slate-400 text-sm hover:text-white transition-colors">
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-heading font-semibold text-white text-base">Portal</p>
            <Link href="/login" className="text-slate-400 text-sm hover:text-white transition-colors">
              Entrar
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-heading font-semibold text-white text-base">Contato</p>
            <a href="mailto:contato@camaraocamarada.com.br" className="text-slate-400 text-sm hover:text-white transition-colors">
              contato@camaraocamarada.com.br
            </a>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8">
          <p className="text-slate-500 text-[13px] text-center">
            © 2026 Camarão Camarada. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  )
}
