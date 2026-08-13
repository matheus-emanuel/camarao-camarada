import { Shield, TrendingUp, CheckCircle2, type LucideIcon } from 'lucide-react'

interface Benefit {
  icon: LucideIcon
  title: string
  highlight: string
  description: string
}

const BENEFITS: Benefit[] = [
  {
    icon: Shield,
    title: 'Redução de Mortalidade',
    highlight: 'Menos Perdas',
    description: 'Identifique quedas de oxigênio ou picos de amônia a tempo de agir, antes que afetem o lote inteiro.',
  },
  {
    icon: TrendingUp,
    title: 'Aumento de Produtividade',
    highlight: 'Mais Previsibilidade',
    description: 'Veja o histórico de cada viveiro e entenda quais condições levam aos melhores resultados no despesque.',
  },
  {
    icon: CheckCircle2,
    title: 'Conformidade Ambiental',
    highlight: 'Rastreabilidade',
    description: 'Tenha o histórico completo de análises documentado e pronto para comprovação junto a órgãos reguladores.',
  },
]

export function Benefits() {
  return (
    <section id="beneficios" className="bg-white px-6 lg:px-20 py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="bg-sky-50 text-ocean-600 text-[13px] font-bold uppercase tracking-wide rounded-full px-4 py-1.5">
            Por que Monitorar de Perto
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-[40px] leading-tight text-slate-900 max-w-2xl">
            Por que Digitalizar o Acompanhamento da Água?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            A estabilidade da água está diretamente ligada ao sucesso do despesque e à
            lucratividade do seu negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {BENEFITS.map((benefit) => {
            const Icon = benefit.icon
            return (
              <div key={benefit.title} className="bg-slate-100 rounded-3xl p-8 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <Icon className="size-5 text-ocean-600" />
                  <p className="font-heading font-semibold text-lg text-slate-900">{benefit.title}</p>
                </div>
                <p className="font-heading font-bold text-4xl text-ocean-600">{benefit.highlight}</p>
                <p className="text-base text-slate-600 leading-relaxed">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
