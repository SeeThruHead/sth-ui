import { Predicate } from "effect"

export type NumberInputValues = { readonly value: string; readonly floatValue: number | undefined }

export type AllowedCheck = (values: NumberInputValues) => boolean

export const isAllowedCheck = (value: unknown): value is AllowedCheck => Predicate.isFunction(value)

export type RefusalRules = {
  readonly allowNegative: boolean
  readonly allowDecimal: boolean
  readonly decimalScale: number
  readonly separator: string
}

export const nextText = (text: string, start: number, end: number, data: string): string =>
  `${text.slice(0, start)}${data}${text.slice(end)}`

export const refusesInput = (rules: RefusalRules, text: string, start: number, end: number, data: string): boolean => {
  if (!rules.allowNegative && data.includes("-")) return true
  if (!rules.allowDecimal && /[.,]/.test(data)) return true
  if (rules.decimalScale < 0) return false
  const fraction = nextText(text, start, end, data).split(rules.separator)[1] ?? ""

  return fraction.replace(/\D/g, "").length > rules.decimalScale
}

export const valuesOf = (text: string, separator: string): NumberInputValues => {
  const plain = text.replaceAll(separator, ".").replace(/[^\d.-]/g, "")
  const parsed = Number(plain)

  return { value: plain, floatValue: plain === "" || Number.isNaN(parsed) ? undefined : parsed }
}
