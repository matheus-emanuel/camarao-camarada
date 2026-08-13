import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Plan {
  name: string
  tagline: string
  price: string
  period?: string
  featured?: boolean
  features: string[]
  cta: string
  mailSubject: string
}

const PLANS: Plan[] = [
  {
    name: 'Essencial',
    tagline: 'Para laboratórios que estão começando a digitalizar o atendimento.',
    price: 'R$ 199',
    period: '/mês',
    features: [
      'Até 10 clientes cadastrados',
      'Os 6 parâmetros essenciais',
      'Alertas por e-mail',
      'Suporte padrão',
    ],
    cta: 'Quero Começar',
    mailSubject: 'Interesse no plano Essencial',
  },
  {
    name: 'Profissional',
    tagline: 'Para laboratórios em crescimento, com atendimento mais completo.',
    price: 'R$ 499',
    period: '/mês',
    featured: true,
    features: [
      'Até 50 clientes cadastrados',
      'Os 25 parâmetros de qualidade da água',
      'Relatórios completos em PDF',
      'Alertas por e-mail ilimitados',
      'Orientações práticas por parâmetro',
    ],
    cta: 'Quero Este Plano',
    mailSubject: 'Interesse no plano Profissional',
  },
  {
    name: 'Sob Medida',
    tagline: 'Para redes de laboratórios ou operações de grande escala.',
    price: 'Sob consulta',
    features: [
      'Clientes cadastrados ilimitados',
      'Integrações personalizadas',
      'Suporte técnico prioritário',
      'Treinamento da equipe',
    ],
    cta: 'Falar com a Gente',
    mailSubject: 'Interesse no plano Sob Medida',
  },
]

export function Pricing() {
  return (
    <section id="precos" className="bg-white px-6 lg:px-20 py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="bg-sky-50 text-ocean-600 text-[13px] font-bold uppercase tracking-wide rounded-full px-4 py-1.5">
            Planos para Laboratórios
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-[40px] leading-tight text-slate-900 max-w-2xl">
            O Tamanho Certo para o seu Laboratório
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Escolha o plano de acordo com a quantidade de clientes que você atende.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col gap-8 rounded-3xl p-10 border',
                plan.featured
                  ? 'bg-[#0f172a] border-ocean-500 border-2 shadow-[0px_12px_24px_rgba(2,132,199,0.12)]'
                  : 'bg-white border-gray-200'
              )}
            >
              <div className="flex flex-col gap-3">
                {plan.featured && (
                  <span className="bg-ocean-600 text-white text-[11px] font-bold uppercase tracking-wide rounded-full px-3 py-1 w-fit">
                    Mais Popular
                  </span>
                )}
                <h3 className={cn('font-heading font-bold text-[22px]', plan.featured ? 'text-white' : 'text-slate-900')}>
                  {plan.name}
                </h3>
                <p className={cn('text-[15px] leading-snug', plan.featured ? 'text-slate-400' : 'text-slate-600')}>
                  {plan.tagline}
                </p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className={cn('font-heading font-extrabold text-[44px]', plan.featured ? 'text-white' : 'text-slate-900')}>
                  {plan.price}
                </span>
                {plan.period && <span className="text-slate-400 text-base">{plan.period}</span>}
              </div>

              <ul className="flex flex-col gap-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <CheckCircle2 className="size-[18px] text-ocean-500 shrink-0 mt-0.5" />
                    <span className={cn('text-sm', plan.featured ? 'text-slate-100' : 'text-slate-700')}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={cn(
                  'rounded-full mt-auto',
                  plan.featured ? 'bg-brand hover:bg-brand/90' : 'bg-ocean-600 hover:bg-ocean-700'
                )}
              >
                <a href={`mailto:contato@camaraocamarada.com.br?subject=${encodeURIComponent(plan.mailSubject)}`}>
                  {plan.cta}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
