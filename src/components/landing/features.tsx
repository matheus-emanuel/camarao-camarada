import { Bell, Calendar, FileText, Zap, type LucideIcon } from 'lucide-react'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: Bell,
    title: 'Alertas por E-mail',
    description: 'Assim que um parâmetro sai da faixa segura, o cliente recebe um e-mail explicando o que aconteceu.',
  },
  {
    icon: Calendar,
    title: 'Histórico Completo',
    description: 'Gráficos com o histórico de cada parâmetro por viveiro, prontos para identificar tendências entre uma coleta e outra.',
  },
  {
    icon: FileText,
    title: 'Relatórios em PDF',
    description: 'Exporte o laudo de qualquer análise em PDF com um clique — pronto para o cliente ou para auditorias.',
  },
  {
    icon: Zap,
    title: 'Orientações Práticas',
    description: 'Quando um resultado foge da faixa ideal, o portal explica em linguagem simples o que fazer a seguir.',
  },
]

export function Features() {
  return (
    <section id="funcionalidades" className="bg-[#fafcff] px-6 lg:px-20 py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="bg-sky-50 text-ocean-600 text-[13px] font-bold uppercase tracking-wide rounded-full px-4 py-1.5">
            Funcionalidades da Plataforma
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-[40px] leading-tight text-slate-900 max-w-2xl">
            Do Laboratório ao Cliente, em um Só Lugar
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Registre a análise uma vez e deixe que o portal cuide do resto: histórico, alertas,
            relatórios e orientações práticas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="bg-white border border-gray-200 rounded-[20px] p-8 flex flex-col gap-5">
                <div className="bg-teal-100 rounded-xl size-12 flex items-center justify-center">
                  <Icon className="size-6 text-teal-700" />
                </div>
                <div className="flex flex-col gap-2.5">
                  <h3 className="font-heading font-semibold text-xl text-slate-900">{feature.title}</h3>
                  <p className="text-[15px] text-slate-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
