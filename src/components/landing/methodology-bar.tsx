const CATEGORIES = ['Campo', 'Laboratório', 'Microbiológico', 'Contaminantes']

export function MethodologyBar() {
  return (
    <section className="bg-white border-y border-gray-200 py-10 px-6 lg:px-20">
      <div className="max-w-[1400px] mx-auto flex flex-col items-center gap-5 text-slate-400">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-center">
          Baseado nos 25 parâmetros oficiais de qualidade da água para Litopenaeus vannamei
        </p>
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 font-heading font-bold text-lg text-slate-500">
          {CATEGORIES.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
