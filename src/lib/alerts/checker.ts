import type { Parameter, AnalysisResultInput } from '@/types/app'

export interface CheckedResult extends AnalysisResultInput {
  is_alert: boolean
}

export function checkAlerts(
  results: AnalysisResultInput[],
  parameters: Parameter[]
): CheckedResult[] {
  const paramMap = new Map(parameters.map((p) => [p.id, p]))

  return results.map((result) => {
    const param = paramMap.get(result.parameter_id)

    if (!param || result.value === null) {
      return { ...result, is_alert: false }
    }

    const { ref_min, ref_max } = param
    const isBelow = ref_min !== null && result.value < ref_min
    const isAbove = ref_max !== null && result.value > ref_max

    return { ...result, is_alert: isBelow || isAbove }
  })
}

export function hasAnyAlert(checkedResults: CheckedResult[]): boolean {
  return checkedResults.some((r) => r.is_alert)
}

export function countAlerts(checkedResults: CheckedResult[]): number {
  return checkedResults.filter((r) => r.is_alert).length
}
