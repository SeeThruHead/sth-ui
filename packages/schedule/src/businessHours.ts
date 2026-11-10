import { timeSeconds } from "./dayLayout.ts"

export type BusinessHoursState =
  | { readonly _tag: "None" }
  | { readonly _tag: "Business" }
  | { readonly _tag: "NonBusiness" }
  | { readonly _tag: "Partial"; readonly from: number; readonly to: number }

export const businessHoursState = (input: {
  readonly start: string
  readonly end: string
  readonly businessHours: readonly [string, string]
  readonly highlight: boolean
}): BusinessHoursState => {
  if (!input.highlight) return { _tag: "None" }
  const start = timeSeconds(input.start)
  const end = timeSeconds(input.end)
  const from = Math.max(start, timeSeconds(input.businessHours[0]))
  const to = Math.min(end, timeSeconds(input.businessHours[1]))
  if (to <= from) return { _tag: "NonBusiness" }
  if (from === start && to === end) return { _tag: "Business" }
  const length = end - start

  return { _tag: "Partial", from: ((from - start) / length) * 100, to: ((to - start) / length) * 100 }
}
