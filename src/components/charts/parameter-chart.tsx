'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ChartDataPoint } from '@/types/app'

interface ParameterChartProps {
  data: ChartDataPoint[]
  parameterName: string
  unit: string | null
  refMin: number | null
  refMax: number | null
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: { alert: boolean }
}

function AlertDot({ cx, cy, payload }: DotProps) {
  if (!cx || !cy) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={payload?.alert ? '#ef4444' : '#0284c7'}
      stroke="white"
      strokeWidth={2}
    />
  )
}

export function ParameterChart({ data, parameterName, unit, refMin, refMax }: ParameterChartProps) {
  const formatted = data.map((d) => ({
    date: format(parseISO(d.collected_at), 'dd/MM', { locale: ptBR }),
    value: d.value,
    alert: d.is_alert,
  }))

  const unitLabel = unit ? ` (${unit})` : ''

  return (
    <div className="w-full">
      <p className="text-sm font-medium text-gray-700 mb-2">
        {parameterName}{unitLabel}
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={formatted} margin={{ top: 8, right: 20, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => (unit ? `${v}` : v)}
            width={50}
          />
          <Tooltip
            formatter={(value: number) => [`${value}${unit ? ` ${unit}` : ''}`, parameterName]}
            labelFormatter={(label) => `Data: ${label}`}
          />
          {refMin !== null && (
            <ReferenceLine
              y={refMin}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: `Mín ${refMin}`, fill: '#d97706', fontSize: 10, position: 'insideBottomLeft' }}
            />
          )}
          {refMax !== null && (
            <ReferenceLine
              y={refMax}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: `Máx ${refMax}`, fill: '#dc2626', fontSize: 10, position: 'insideTopLeft' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#0284c7"
            strokeWidth={2}
            dot={(props) => <AlertDot key={`dot-${props.cx}-${props.cy}`} {...props} />}
            activeDot={{ r: 6 }}
          />
          <Legend
            formatter={() => parameterName}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </LineChart>
      </ResponsiveContainer>
      {(refMin !== null || refMax !== null) && (
        <div className="flex gap-4 mt-2 text-xs text-gray-500">
          {refMin !== null && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-6 border-t-2 border-dashed border-yellow-500" />
              Mínimo: {refMin}{unit ? ` ${unit}` : ''}
            </span>
          )}
          {refMax !== null && (
            <span className="flex items-center gap-1">
              <span className="inline-block w-6 border-t-2 border-dashed border-red-500" />
              Máximo: {refMax}{unit ? ` ${unit}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
