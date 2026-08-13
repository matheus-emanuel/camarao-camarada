import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Hero() {
  return (
    <section className="px-6 lg:px-20 pt-16 pb-20 lg:pt-24 lg:pb-24">
      <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-12 items-center">
        <div className="flex-1 flex flex-col items-start gap-8">
          <span className="bg-sky-50 text-ocean-600 text-xs font-bold uppercase tracking-wide rounded-full px-4 py-1.5">
            Para Laboratórios de Análise de Água
          </span>

          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl leading-[1.15] text-slate-900">
            Leve os resultados do laboratório{' '}
            <span className="text-ocean-600">direto para o produtor</span>
          </h1>

          <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
            Chega de planilha solta e papel perdido. Registre a análise de cada viveiro e deixe
            que o seu cliente acompanhe o histórico, os alertas e as orientações num portal só
            dele.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button asChild className="rounded-full px-7 py-6 text-base gap-2 bg-brand hover:bg-brand/90">
              <a href="#como-funciona">
                Ver Como Funciona
                <ArrowRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="rounded-full px-7 py-6 text-base border-[1.5px] border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white">
              <a href="#precos">Conhecer Planos</a>
            </Button>
          </div>
        </div>

        <div className="relative w-full lg:w-[515px] h-[340px] sm:h-[420px] lg:h-[480px] rounded-[24px] overflow-hidden shadow-[0px_12px_32px_0px_rgba(0,0,0,0.12)] shrink-0">
          <Image
            src="/landing-hero.png"
            alt="Vista aérea de viveiros de carcinicultura"
            fill
            sizes="(min-width: 1024px) 515px, 100vw"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}
