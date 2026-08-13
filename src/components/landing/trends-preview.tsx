import Image from 'next/image'

export function TrendsPreview() {
  return (
    <section className="bg-[#0f172a] px-6 lg:px-20 py-20 lg:py-24">
      <div className="max-w-[1400px] mx-auto flex flex-col gap-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="bg-white/15 text-white text-[13px] font-bold uppercase tracking-wide rounded-full px-4 py-1.5">
            Visualização de Dados
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-[40px] leading-tight text-white max-w-2xl">
            Enxergue Tendências Entre uma Análise e Outra
          </h2>
          <p className="text-lg text-slate-200 max-w-2xl">
            Gráficos de histórico por viveiro ajudam a identificar padrões antes que virem
            problema — puxados direto das análises já registradas pelo laboratório.
          </p>
        </div>

        <div className="bg-[#1e293b] border border-slate-700 rounded-3xl overflow-hidden">
          <div className="border-b border-slate-700 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between p-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <span className="size-3 rounded-full bg-red-500" />
                <span className="size-3 rounded-full bg-amber-500" />
                <span className="size-3 rounded-full bg-seagreen-500" />
              </div>
              <p className="font-heading font-semibold text-white">Viveiro 04 · Histórico de Análises</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-ocean-600 text-white text-xs font-semibold rounded-md px-3 py-1.5">Últimas 5</span>
              <span className="bg-slate-700 text-slate-400 text-xs font-semibold rounded-md px-3 py-1.5">Últimos 90 dias</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 p-6 sm:p-8">
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between font-heading font-semibold text-white text-base">
                <p>Oxigênio Dissolvido (mg/L)</p>
                <p className="text-teal-400 text-sm">Média: 5.1 mg/L</p>
              </div>
              <div className="bg-[#0f172a] rounded-xl p-4">
                <Image src="/sparkline-oxigenio.svg" alt="" width={501} height={182} className="w-full h-auto" />
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3">
                  <span>1ª coleta</span>
                  <span>2ª coleta</span>
                  <span>3ª coleta</span>
                  <span>4ª coleta</span>
                </div>
              </div>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              <div className="flex items-center justify-between font-heading font-semibold text-white text-base">
                <p>Temperatura (°C)</p>
                <p className="text-orange-500 text-sm">Média: 29.1 °C</p>
              </div>
              <div className="bg-[#0f172a] rounded-xl p-4">
                <Image src="/sparkline-temperatura.svg" alt="" width={501} height={182} className="w-full h-auto" />
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3">
                  <span>1ª coleta</span>
                  <span>2ª coleta</span>
                  <span>3ª coleta</span>
                  <span>4ª coleta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
