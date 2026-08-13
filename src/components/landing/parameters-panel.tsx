import { Wind, Droplet, Thermometer, Activity, AlertTriangle, Database, ArrowUp, ArrowDown, type LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ParamCard {
  name: string
  value: string
  unit: string
  icon: LucideIcon
  status: 'success' | 'warning' | 'critical'
  statusLabel: string
  delta: string
  deltaDirection: 'up' | 'down'
}

const PARAMS: ParamCard[] = [
  { name: 'Oxigênio Dissolvido', value: '5.2', unit: 'mg/L', icon: Wind, status: 'success', statusLabel: 'Estável', delta: '+0.4', deltaDirection: 'up' },
  { name: 'pH', value: '7.8', unit: 'pH', icon: Droplet, status: 'success', statusLabel: 'Estável', delta: '-0.1', deltaDirection: 'down' },
  { name: 'Temperatura', value: '29.4', unit: '°C', icon: Thermometer, status: 'warning', statusLabel: 'Alerta', delta: '+1.8', deltaDirection: 'up' },
  { name: 'Salinidade', value: '24.0', unit: 'ppt', icon: Activity, status: 'success', statusLabel: 'Estável', delta: '0.0', deltaDirection: 'up' },
  { name: 'Amônia Total (TAN)', value: '1.2', unit: 'mg/L', icon: AlertTriangle, status: 'critical', statusLabel: 'Crítico', delta: '+0.3', deltaDirection: 'up' },
  { name: 'Alcalinidade', value: '115.0', unit: 'mg/L', icon: Database, status: 'success', statusLabel: 'Estável', delta: '+5.0', deltaDirection: 'up' },
]

export function ParametersPanel() {
  return (
    <section id="parametros" className="bg-[#fafcff] px-6 lg:px-20 py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="bg-sky-50 text-ocean-600 text-[13px] font-bold uppercase tracking-wide rounded-full px-4 py-1.5">
            Parâmetros Acompanhados
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-[40px] leading-tight text-slate-900 max-w-2xl">
            Os Parâmetros que Mais Importam para o seu Viveiro
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl">
            Cada análise registrada pelo laboratório atualiza o retrato da qualidade da água do
            viveiro — sem planilha, sem demora.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PARAMS.map((param) => {
            const Icon = param.icon
            const DeltaIcon = param.deltaDirection === 'up' ? ArrowUp : ArrowDown
            const deltaColor = param.deltaDirection === 'up' ? 'text-seagreen-600' : 'text-red-500'
            return (
              <div key={param.name} className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="bg-sky-50 rounded-lg p-2">
                    <Icon className="size-5 text-ocean-600" />
                  </div>
                  <Badge variant={param.status}>{param.statusLabel}</Badge>
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium text-slate-600">{param.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading font-bold text-4xl text-slate-900">{param.value}</span>
                    <span className="text-base font-medium text-slate-400">{param.unit}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <DeltaIcon className={`size-3.5 ${deltaColor}`} />
                  <span className={`font-medium ${deltaColor}`}>{param.delta}</span>
                  <span className="text-slate-400">desde a análise anterior</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
