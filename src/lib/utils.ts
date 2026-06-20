import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, pattern = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern, { locale: ptBR })
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

export function formatValue(value: number | null, unit: string | null): string {
  if (value === null) return '—'
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(2)
  return unit ? `${formatted} ${unit}` : formatted
}

export function formatArea(value: number | null, unit: 'ha' | 'm²'): string {
  if (value === null) return '—'
  return `${value.toLocaleString('pt-BR')} ${unit}`
}

export function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    campo: 'Campo',
    laboratorio: 'Laboratório',
    microbiologico: 'Microbiológico',
    contaminantes: 'Contaminantes',
  }
  return labels[category] ?? category
}
