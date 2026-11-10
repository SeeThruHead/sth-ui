export type ThousandsGroupStyle = "thousand" | "lakh" | "wan" | "none"

export type NumberFormatterFormat = {
  readonly allowNegative?: boolean
  readonly decimalScale?: number
  readonly decimalSeparator?: string
  readonly fixedDecimalScale?: boolean
  readonly prefix?: string
  readonly suffix?: string
  readonly thousandsGroupStyle?: ThousandsGroupStyle
  readonly thousandSeparator?: string | boolean
}

const groupPatterns: Readonly<Record<Exclude<ThousandsGroupStyle, "none">, RegExp>> = {
  thousand: /(\d)(?=(\d{3})+(?!\d))/g,
  lakh: /(\d+?)(?=(\d\d)+(\d)(?!\d))(\.\d+)?/g,
  wan: /(\d)(?=(\d{4})+(?!\d))/g
}

const separatorOf = (format: NumberFormatterFormat): string => {
  if (format.thousandSeparator === true) return ","
  if (typeof format.thousandSeparator === "string") return format.thousandSeparator

  return ""
}

const grouped = (digits: string, format: NumberFormatterFormat): string => {
  const separator = separatorOf(format)
  const style = format.thousandsGroupStyle ?? "thousand"
  if (separator === "" || style === "none") return digits

  return digits.replace(groupPatterns[style], `$1${separator}`)
}

const exponential = /^(-?)(\d+)(?:\.(\d+))?e([+-]\d+)$/

export const numericString = (value: number): string => {
  const text = String(value)
  const match = exponential.exec(text)
  if (match === null) return text
  const whole = String(match[2])
  const digits = `${whole}${match[3] ?? ""}`
  const point = whole.length + Number(match[4])
  const written = point <= 0 ? `0.${"0".repeat(-point)}${digits}` : digits.padEnd(point, "0")

  return `${String(match[1])}${written}`
}

type Parts = { readonly negative: boolean; readonly whole: string; readonly fraction: string }

const partsOf = (text: string): Parts => {
  const unsigned = text.replace("-", "")
  const point = unsigned.indexOf(".")
  const whole = point < 0 ? unsigned : unsigned.slice(0, point)

  return {
    negative: text.startsWith("-"),
    whole: whole === "" ? "0" : whole,
    fraction: point < 0 ? "" : unsigned.slice(point + 1)
  }
}

const rounded = (parts: Parts, scale: number): Parts => {
  if (parts.fraction.length <= scale) return parts
  const fixed = Number.parseFloat(`0.${parts.fraction}`).toFixed(scale)

  return {
    ...parts,
    whole: (BigInt(parts.whole) + BigInt(fixed.slice(0, 1))).toString(),
    fraction: fixed.slice(2)
  }
}

const scaled = (parts: Parts, format: NumberFormatterFormat, round: boolean): Parts => {
  if (format.decimalScale === undefined) return parts
  const scale = format.decimalScale
  const fitted = round ? rounded(parts, scale) : parts
  const fraction = fitted.fraction.slice(0, scale)

  return { ...fitted, fraction: format.fixedDecimalScale === true ? fraction.padEnd(scale, "0") : fraction }
}

export const formatNumber = (value: number | string, format: NumberFormatterFormat = {}): string => {
  const text = typeof value === "number" ? numericString(value) : value.replace(/[^\d.-]/g, "")
  const signed = format.allowNegative === false ? text.replace("-", "") : text
  const parts = scaled(partsOf(signed), format, typeof value === "number")
  const decimals = parts.fraction === "" ? "" : `${format.decimalSeparator ?? "."}${parts.fraction}`

  return `${parts.negative ? "-" : ""}${format.prefix ?? ""}${grouped(parts.whole, format)}${decimals}${format.suffix ?? ""}`
}
