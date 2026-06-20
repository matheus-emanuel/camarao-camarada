import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Farm = Database['public']['Tables']['farms']['Row']
export type Pond = Database['public']['Tables']['ponds']['Row']
export type Parameter = Database['public']['Tables']['parameters']['Row']
export type Analysis = Database['public']['Tables']['analyses']['Row']
export type AnalysisResult = Database['public']['Tables']['analysis_results']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type UserRole = 'lab_admin' | 'client'
export type ParameterCategory = 'campo' | 'laboratorio' | 'microbiologico' | 'contaminantes'
export type SystemType = 'extensivo' | 'semi-intensivo' | 'intensivo' | 'bioflocos'

export interface AnalysisWithResults extends Analysis {
  analysis_results: (AnalysisResult & { parameters: Parameter })[]
  ponds?: Pond & { farms?: Farm & { clients?: Client } }
}

export interface PondWithFarm extends Pond {
  farms: Farm & { clients: Client }
}

export interface FarmWithClient extends Farm {
  clients: Client
}

export interface AnalysisResultInput {
  parameter_id: string
  value: number | null
  value_text?: string | null
}

export interface CreateAnalysisPayload {
  pond_id: string
  collected_at: string
  analyzed_at?: string | null
  technician?: string | null
  notes?: string | null
  results: AnalysisResultInput[]
}

export interface AlertedParam {
  name: string
  value: string
  unit: string | null
  ref_min: number | null
  ref_max: number | null
}

export interface ChartDataPoint {
  collected_at: string
  value: number
  is_alert: boolean
}
