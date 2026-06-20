import { formatDate, formatValue, categoryLabel } from '@/lib/utils'
import type { AnalysisWithResults } from '@/types/app'

interface AnalysisPdfLayoutProps {
  analysis: AnalysisWithResults
  pondName: string
  farmName: string
  clientName: string
}

export function AnalysisPdfLayout({ analysis, pondName, farmName, clientName }: AnalysisPdfLayoutProps) {
  const alertResults = analysis.analysis_results.filter((r) => r.is_alert)

  return (
    <div
      id="pdf-content"
      style={{
        display: 'none',
        fontFamily: 'Arial, sans-serif',
        padding: '32px',
        maxWidth: '720px',
        background: 'white',
        color: '#1f2937',
      }}
    >
      {/* Header */}
      <div style={{ borderBottom: '3px solid #0284c7', paddingBottom: '16px', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0c4a6e', margin: 0 }}>
          🦐 Camarão Camarada
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
          Relatório de Análise da Qualidade da Água
        </p>
      </div>

      {/* Info grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>CLIENTE</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{clientName}</p>
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>FAZENDA</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{farmName}</p>
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>VIVEIRO</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>{pondName}</p>
        </div>
        <div>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>DATA DA COLETA</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>
            {formatDate(analysis.collected_at, "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>
        {analysis.technician && (
          <div>
            <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>ANALISTA</p>
            <p style={{ fontSize: '14px', margin: 0 }}>{analysis.technician}</p>
          </div>
        )}
        <div>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px' }}>STATUS</p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: analysis.has_alerts ? '#dc2626' : '#16a34a', margin: 0 }}>
            {analysis.has_alerts ? `⚠ ${alertResults.length} alerta(s)` : '✓ Normal'}
          </p>
        </div>
      </div>

      {analysis.notes && (
        <div style={{ background: '#f9fafb', borderRadius: '8px', padding: '12px', marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 4px' }}>OBSERVAÇÕES</p>
          <p style={{ fontSize: '13px', margin: 0 }}>{analysis.notes}</p>
        </div>
      )}

      {/* Results table */}
      <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0c4a6e', marginBottom: '12px' }}>
        Resultados
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#f0f9ff' }}>
            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '2px solid #bae6fd', color: '#0369a1' }}>Parâmetro</th>
            <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '2px solid #bae6fd', color: '#0369a1' }}>Valor</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #bae6fd', color: '#0369a1' }}>Referência</th>
            <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '2px solid #bae6fd', color: '#0369a1' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {analysis.analysis_results.map((r, i) => {
            const { ref_min, ref_max, unit } = r.parameters
            const refLabel =
              ref_min !== null && ref_max !== null
                ? `${ref_min} – ${ref_max}`
                : ref_max !== null
                ? `≤ ${ref_max}`
                : ref_min !== null
                ? `≥ ${ref_min}`
                : '—'
            return (
              <tr
                key={r.id}
                style={{
                  background: r.is_alert ? '#fff1f2' : i % 2 === 0 ? 'white' : '#f9fafb',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <td style={{ padding: '7px 12px', fontWeight: r.is_alert ? 'bold' : 'normal', color: '#1f2937' }}>
                  {r.parameters.name}
                </td>
                <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'monospace', color: r.is_alert ? '#dc2626' : '#1f2937', fontWeight: r.is_alert ? 'bold' : 'normal' }}>
                  {r.value !== null ? formatValue(r.value, unit) : r.value_text ?? '—'}
                </td>
                <td style={{ padding: '7px 12px', textAlign: 'center', color: '#6b7280' }}>
                  {refLabel}{unit ? ` ${unit}` : ''}
                </td>
                <td style={{ padding: '7px 12px', textAlign: 'center', color: r.is_alert ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                  {r.is_alert ? '⚠ Alerta' : '✓ OK'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '12px', color: '#9ca3af', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Gerado em {formatDate(new Date(), "dd/MM/yyyy 'às' HH:mm")}</span>
        <span>Camarão Camarada — Portal de Monitoramento da Qualidade da Água</span>
      </div>
    </div>
  )
}
