import { checkAlerts, hasAnyAlert, countAlerts } from './checker'
import type { Parameter } from '@/types/app'

const makeParam = (overrides: Partial<Parameter>): Parameter => ({
  id: 'p1',
  name: 'Teste',
  unit: 'mg/L',
  category: 'campo',
  ref_min: null,
  ref_max: null,
  description: null,
  method: null,
  active: true,
  display_order: 0,
  created_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

describe('checkAlerts', () => {
  it('returns is_alert=false when no ref values defined', () => {
    const param = makeParam({ id: 'p1', ref_min: null, ref_max: null })
    const results = checkAlerts([{ parameter_id: 'p1', value: 999 }], [param])
    expect(results[0].is_alert).toBe(false)
  })

  it('returns is_alert=false when value is null', () => {
    const param = makeParam({ id: 'p1', ref_min: 5, ref_max: 10 })
    const results = checkAlerts([{ parameter_id: 'p1', value: null }], [param])
    expect(results[0].is_alert).toBe(false)
  })

  it('returns is_alert=true when value is above ref_max', () => {
    const param = makeParam({ id: 'p1', ref_min: null, ref_max: 1.0 })
    const results = checkAlerts([{ parameter_id: 'p1', value: 1.5 }], [param])
    expect(results[0].is_alert).toBe(true)
  })

  it('returns is_alert=true when value is below ref_min', () => {
    const param = makeParam({ id: 'p1', ref_min: 5.0, ref_max: null })
    const results = checkAlerts([{ parameter_id: 'p1', value: 3.0 }], [param])
    expect(results[0].is_alert).toBe(true)
  })

  it('returns is_alert=false when value is within range', () => {
    const param = makeParam({ id: 'p1', ref_min: 7.5, ref_max: 8.5 })
    const results = checkAlerts([{ parameter_id: 'p1', value: 8.0 }], [param])
    expect(results[0].is_alert).toBe(false)
  })

  it('returns is_alert=false when value equals ref boundary', () => {
    const param = makeParam({ id: 'p1', ref_min: 7.5, ref_max: 8.5 })
    const results = checkAlerts([{ parameter_id: 'p1', value: 7.5 }], [param])
    expect(results[0].is_alert).toBe(false)
  })

  it('handles unknown parameter_id gracefully', () => {
    const results = checkAlerts([{ parameter_id: 'unknown', value: 999 }], [])
    expect(results[0].is_alert).toBe(false)
  })

  it('processes multiple results correctly', () => {
    const params = [
      makeParam({ id: 'p1', ref_min: null, ref_max: 1.0 }),
      makeParam({ id: 'p2', ref_min: 22.5, ref_max: 28.8 }),
    ]
    const results = checkAlerts(
      [
        { parameter_id: 'p1', value: 1.5 },
        { parameter_id: 'p2', value: 25.0 },
      ],
      params
    )
    expect(results[0].is_alert).toBe(true)
    expect(results[1].is_alert).toBe(false)
  })
})

describe('hasAnyAlert', () => {
  it('returns true when at least one alert exists', () => {
    expect(hasAnyAlert([{ parameter_id: 'p1', value: 1, is_alert: true }])).toBe(true)
  })

  it('returns false when no alerts', () => {
    expect(hasAnyAlert([{ parameter_id: 'p1', value: 1, is_alert: false }])).toBe(false)
  })
})

describe('countAlerts', () => {
  it('counts correctly', () => {
    const results = [
      { parameter_id: 'p1', value: 1, is_alert: true },
      { parameter_id: 'p2', value: 2, is_alert: false },
      { parameter_id: 'p3', value: 3, is_alert: true },
    ]
    expect(countAlerts(results)).toBe(2)
  })
})
