export type ColorFormat = "hex" | "hexa" | "rgb" | "rgba" | "hsl" | "hsla"

export type HsvaColor = { readonly h: number; readonly s: number; readonly v: number; readonly a: number }

export type RgbaColor = { readonly r: number; readonly g: number; readonly b: number; readonly a: number }

const black: HsvaColor = { h: 0, s: 0, v: 0, a: 1 }

export const round = (value: number, digits = 0): number => Math.round(10 ** digits * value) / 10 ** digits

const hslaToHsva = (h: number, s: number, l: number, a: number): HsvaColor => {
  const ss = s * ((l < 50 ? l : 100 - l) / 100)

  return { h, s: ss > 0 ? ((2 * ss) / (l + ss)) * 100 : 0, v: l + ss, a }
}

const angleUnits: Readonly<Record<string, number>> = { grad: 360 / 400, turn: 360, rad: 360 / (Math.PI * 2) }

export const parseHue = (value: string, unit = "deg"): number => Number(value) * (angleUnits[unit] ?? 1)

const hslPattern =
  /hsla?\(?\s*(-?\d*\.?\d+)(deg|rad|grad|turn)?[,\s]+(-?\d*\.?\d+)%?[,\s]+(-?\d*\.?\d+)%?,?\s*[/\s]*(-?\d*\.?\d+)?(%)?\s*\)?/i

const rgbPattern =
  /rgba?\(?\s*(-?\d*\.?\d+)(%)?[,\s]+(-?\d*\.?\d+)(%)?[,\s]+(-?\d*\.?\d+)(%)?,?\s*[/\s]*(-?\d*\.?\d+)?(%)?\s*\)?/i

const alphaOf = (value: string | undefined, percent: string | undefined): number => {
  if (value === undefined) return 1

  return Number(value) / (percent === undefined ? 1 : 100)
}

export const parseHsla = (color: string): HsvaColor => {
  const match = hslPattern.exec(color)
  if (match === null) return black

  return hslaToHsva(
    parseHue(String(match[1]), match[2]),
    Number(match[3]),
    Number(match[4]),
    alphaOf(match[5], match[6])
  )
}

const hueOf = (r: number, g: number, b: number, max: number, delta: number): number => {
  if (delta === 0) return 0
  if (max === r) return (g - b) / delta
  if (max === g) return 2 + (b - r) / delta

  return 4 + (r - g) / delta
}

const rgbaToHsva = ({ r, g, b, a }: RgbaColor): HsvaColor => {
  const max = Math.max(r, g, b)
  const delta = max - Math.min(r, g, b)
  const hh = hueOf(r, g, b, max, delta)

  return {
    h: round(60 * (hh < 0 ? hh + 6 : hh), 3),
    s: round(max === 0 ? 0 : (delta / max) * 100, 3),
    v: round((max / 255) * 100, 3),
    a
  }
}

const withoutHash = (color: string): string => (color.startsWith("#") ? color.slice(1) : color)

const expanded = (hex: string): string =>
  hex.length <= 4
    ? hex
        .split("")
        .map((digit) => digit + digit)
        .join("")
    : hex

const channel = (hex: string, at: number): number => Number.parseInt(hex.slice(at, at + 2), 16)

export const parseHex = (color: string): HsvaColor => {
  const hex = expanded(withoutHash(color))

  return rgbaToHsva({ r: channel(hex, 0), g: channel(hex, 2), b: channel(hex, 4), a: 1 })
}

export const parseHexa = (color: string): HsvaColor => {
  const hex = expanded(withoutHash(color))

  return { ...parseHex(hex.slice(0, 6)), a: round(channel(hex, 6) / 255, 3) }
}

const rgbChannel = (value: string | undefined, percent: string | undefined): number =>
  Number(value) / (percent === undefined ? 1 : 100 / 255)

export const parseRgba = (color: string): HsvaColor => {
  const match = rgbPattern.exec(color)
  if (match === null) return black

  return rgbaToHsva({
    r: rgbChannel(match[1], match[2]),
    g: rgbChannel(match[3], match[4]),
    b: rgbChannel(match[5], match[6]),
    a: alphaOf(match[7], match[8])
  })
}

const validation: ReadonlyArray<readonly [ColorFormat, RegExp, (color: string) => HsvaColor]> = [
  ["hex", /^#?([0-9A-F]{3}){1,2}$/i, parseHex],
  ["hexa", /^#?([0-9A-F]{4}){1,2}$/i, parseHexa],
  ["rgb", /^rgb\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i, parseRgba],
  ["rgba", /^rgba\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/i, parseRgba],
  ["hsl", /hsl\(\s*(\d+)\s*,\s*(\d+(?:\.\d+)?%)\s*,\s*(\d+(?:\.\d+)?%)\)/i, parseHsla],
  ["hsla", /^hsla\((\d+),\s*([\d.]+)%,\s*([\d.]+)%,\s*(\d*(?:\.\d+)?)\)$/i, parseHsla]
]

export const isColorValid = (color: string): boolean => validation.some(([, pattern]) => pattern.test(color))

export const parseColor = (color: string): HsvaColor => {
  if (color === "transparent") return { h: 0, s: 0, v: 0, a: 0 }
  const trimmed = color.trim()
  const parser = validation.find(([, pattern]) => pattern.test(trimmed))

  return parser === undefined ? black : parser[2](trimmed)
}

const pick = (values: ReadonlyArray<number>, index: number): number => Number(values[index])

export const hsvaToRgbaObject = ({ h, s, v, a }: HsvaColor): RgbaColor => {
  const hh6 = (h / 360) * 6
  const sat = s / 100
  const value = v / 100
  const hh = Math.floor(hh6)
  const l = value * (1 - sat)
  const c = value * (1 - (hh6 - hh) * sat)
  const d = value * (1 - (1 - hh6 + hh) * sat)
  const segment = hh % 6

  return {
    r: round(pick([value, c, l, l, d, value], segment) * 255),
    g: round(pick([d, value, value, c, l, l], segment) * 255),
    b: round(pick([l, l, d, value, value, c], segment) * 255),
    a: round(a, 2)
  }
}

export const hsvaToRgba = (color: HsvaColor, includeAlpha: boolean): string => {
  const { r, g, b, a } = hsvaToRgbaObject(color)

  return includeAlpha ? `rgba(${r}, ${g}, ${b}, ${round(a, 2)})` : `rgb(${r}, ${g}, ${b})`
}

const hslSaturation = (s: number, v: number, hh: number): number => {
  if (hh <= 0 || hh >= 200) return 0

  return Math.round(((s * v) / 100 / (hh <= 100 ? hh : 200 - hh)) * 100)
}

export const hsvaToHsl = ({ h, s, v, a }: HsvaColor, includeAlpha: boolean): string => {
  const hh = ((200 - s) * v) / 100
  const parts = `${Math.round(h)}, ${hslSaturation(s, v, hh)}%, ${Math.round(hh / 2)}%`

  return includeAlpha ? `hsla(${parts}, ${round(a, 2)})` : `hsl(${parts})`
}

const hexPart = (value: number): string => value.toString(16).padStart(2, "0")

export const hsvaToHex = (color: HsvaColor): string => {
  const { r, g, b } = hsvaToRgbaObject(color)

  return `#${hexPart(r)}${hexPart(g)}${hexPart(b)}`
}

export const hsvaToHexa = (color: HsvaColor): string => `${hsvaToHex(color)}${hexPart(Math.round(color.a * 255))}`

const converters: Readonly<Record<ColorFormat, (color: HsvaColor) => string>> = {
  hex: hsvaToHex,
  hexa: hsvaToHexa,
  rgb: (color) => hsvaToRgba(color, false),
  rgba: (color) => hsvaToRgba(color, true),
  hsl: (color) => hsvaToHsl(color, false),
  hsla: (color) => hsvaToHsl(color, true)
}

export const convertHsvaTo = (format: ColorFormat, color: HsvaColor): string => converters[format](color)

export const withAlpha = (format: ColorFormat): boolean => format === "hexa" || format === "rgba" || format === "hsla"

const gammaCorrect = (value: number): number => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)

export const luminance = (color: string): number => {
  const { r, g, b } = hsvaToRgbaObject(parseColor(color))

  return 0.2126 * gammaCorrect(r / 255) + 0.7152 * gammaCorrect(g / 255) + 0.0722 * gammaCorrect(b / 255)
}
