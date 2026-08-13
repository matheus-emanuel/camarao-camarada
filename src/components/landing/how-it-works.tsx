import { FlaskConical, BellRing, ClipboardCheck, type LucideIcon } from 'lucide-react'

interface Step {
  icon: LucideIcon
  step: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    icon: FlaskConical,
    step: '1',
    title: 'Coleta e Análise',
    description: 'O técnico do laboratório coleta a amostra no viveiro e registra o resultado de cada parâmetro no sistema.',
  },
  {
    icon: BellRing,
    step: '2',
    title: 'Aparece no Portal',
    description: 'O cliente recebe os resultados automaticamente, com gráficos e comparação com a análise anterior.',
  },
  {
    icon: ClipboardCheck,
    step: '3',
    title: 'Alerta e Orientação',
    description: 'Se algum parâmetro sair da faixa ideal, o portal já explica o que aconteceu e o que fazer a seguir.',
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#fafcff] px-6 lg:px-20 py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-14">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="bg-sky-50 text-ocean-600 text-[13px] font-bold uppercase tracking-wide rounded-full px-4 py-1.5">
            Como Funciona
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-[40px] leading-tight text-slate-900 max-w-2xl">
            Da Coleta ao Celular do Cliente
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Um fluxo simples que conecta o trabalho do laboratório à rotina do produtor.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STEPS.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.step} className="bg-white border border-gray-200 rounded-3xl p-10 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="bg-sky-50 rounded-xl size-12 flex items-center justify-center">
                    <Icon className="size-6 text-ocean-600" />
                  </div>
                  <span className="font-heading font-bold text-3xl text-slate-200">{item.step}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="font-heading font-semibold text-lg text-slate-900">{item.title}</p>
                  <p className="text-[15px] text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
