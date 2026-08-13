import Image from 'next/image'
import { Button } from '@/components/ui/button'

export function FinalCta() {
  return (
    <section className="relative px-6 lg:px-20 py-24 lg:py-32 flex flex-col items-center gap-8 text-center overflow-hidden">
      <div aria-hidden className="absolute inset-0">
        <Image src="/landing-cta-bg.png" alt="" fill className="object-cover" />
        <div className="absolute inset-0 bg-[#0f172a]/85" />
      </div>

      <h2 className="relative font-heading font-extrabold text-3xl sm:text-[44px] leading-tight text-white max-w-3xl">
        Comece a Digitalizar as Análises do seu Laboratório
      </h2>
      <p className="relative text-lg text-slate-200 max-w-xl">
        Sem planilha, sem papel perdido. Leve o histórico de qualidade da água para onde o seu
        cliente já está: o celular.
      </p>
      <div className="relative flex flex-wrap justify-center gap-4">
        <Button asChild className="rounded-full px-7 py-6 text-base bg-brand hover:bg-brand/90">
          <a href="mailto:contato@camaraocamarada.com.br">Falar com a Gente</a>
        </Button>
        <Button asChild variant="secondary" className="rounded-full px-7 py-6 text-base bg-slate-100 text-slate-900 hover:bg-white">
          <a href="#precos">Ver Planos</a>
        </Button>
      </div>
    </section>
  )
}
