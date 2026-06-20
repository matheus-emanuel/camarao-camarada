export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'lab_admin' | 'client'
          full_name: string
          phone: string | null
          created_at: string
        }
        Insert: {
          id: string
          role: 'lab_admin' | 'client'
          full_name: string
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'lab_admin' | 'client'
          full_name?: string
          phone?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string | null
          company_name: string | null
          document: string | null
          address: string | null
          city: string | null
          state: string | null
          email: string
          phone: string | null
          active: boolean
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          company_name?: string | null
          document?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          email: string
          phone?: string | null
          active?: boolean
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          user_id?: string | null
          company_name?: string | null
          document?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          email?: string
          phone?: string | null
          active?: boolean
          created_at?: string
          created_by?: string
        }
      }
      farms: {
        Row: {
          id: string
          client_id: string
          name: string
          location: string | null
          city: string | null
          state: string | null
          area_ha: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          location?: string | null
          city?: string | null
          state?: string | null
          area_ha?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          location?: string | null
          city?: string | null
          state?: string | null
          area_ha?: number | null
          created_at?: string
        }
      }
      ponds: {
        Row: {
          id: string
          farm_id: string
          name: string
          area_m2: number | null
          depth_m: number | null
          species: string | null
          system_type: 'extensivo' | 'semi-intensivo' | 'intensivo' | 'bioflocos' | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          farm_id: string
          name: string
          area_m2?: number | null
          depth_m?: number | null
          species?: string | null
          system_type?: 'extensivo' | 'semi-intensivo' | 'intensivo' | 'bioflocos' | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          farm_id?: string
          name?: string
          area_m2?: number | null
          depth_m?: number | null
          species?: string | null
          system_type?: 'extensivo' | 'semi-intensivo' | 'intensivo' | 'bioflocos' | null
          active?: boolean
          created_at?: string
        }
      }
      parameters: {
        Row: {
          id: string
          name: string
          unit: string | null
          category: 'campo' | 'laboratorio' | 'microbiologico' | 'contaminantes'
          ref_min: number | null
          ref_max: number | null
          description: string | null
          method: string | null
          active: boolean
          display_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          unit?: string | null
          category: 'campo' | 'laboratorio' | 'microbiologico' | 'contaminantes'
          ref_min?: number | null
          ref_max?: number | null
          description?: string | null
          method?: string | null
          active?: boolean
          display_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          unit?: string | null
          category?: 'campo' | 'laboratorio' | 'microbiologico' | 'contaminantes'
          ref_min?: number | null
          ref_max?: number | null
          description?: string | null
          method?: string | null
          active?: boolean
          display_order?: number
          created_at?: string
        }
      }
      analyses: {
        Row: {
          id: string
          pond_id: string
          collected_at: string
          analyzed_at: string | null
          technician: string | null
          notes: string | null
          has_alerts: boolean
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          pond_id: string
          collected_at: string
          analyzed_at?: string | null
          technician?: string | null
          notes?: string | null
          has_alerts?: boolean
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          pond_id?: string
          collected_at?: string
          analyzed_at?: string | null
          technician?: string | null
          notes?: string | null
          has_alerts?: boolean
          created_at?: string
          created_by?: string
        }
      }
      analysis_results: {
        Row: {
          id: string
          analysis_id: string
          parameter_id: string
          value: number | null
          value_text: string | null
          is_alert: boolean
          created_at: string
        }
        Insert: {
          id?: string
          analysis_id: string
          parameter_id: string
          value?: number | null
          value_text?: string | null
          is_alert?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          analysis_id?: string
          parameter_id?: string
          value?: number | null
          value_text?: string | null
          is_alert?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          analysis_id: string | null
          client_id: string
          type: 'alert' | 'report' | 'invite'
          recipient_email: string
          sent_at: string
          success: boolean
          error_message: string | null
        }
        Insert: {
          id?: string
          analysis_id?: string | null
          client_id: string
          type: 'alert' | 'report' | 'invite'
          recipient_email: string
          sent_at?: string
          success?: boolean
          error_message?: string | null
        }
        Update: {
          id?: string
          analysis_id?: string | null
          client_id?: string
          type?: 'alert' | 'report' | 'invite'
          recipient_email?: string
          sent_at?: string
          success?: boolean
          error_message?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: {
      current_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      current_client_id: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
