const expandShortHex = (hex: string): string =>
  hex.length === 3
    ? hex
        .split("")
        .map((digit) => digit + digit)
        .join("")
    : hex

const channel = (hex: string, at: number): number => Number.parseInt(hex.slice(at, at + 2), 16) / 255

const gammaCorrect = (value: number): number => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)

export const luminance = (color: string): number => {
  const hex = expandShortHex(color.replace("#", ""))

  return (
    0.2126 * gammaCorrect(channel(hex, 0)) +
    0.7152 * gammaCorrect(channel(hex, 2)) +
    0.0722 * gammaCorrect(channel(hex, 4))
  )
}

export const isLightColor = (color: string, threshold: number): boolean => luminance(color) > threshold

const channels = (color: string): ReadonlyArray<number> => {
  const hex = expandShortHex(color.replace("#", ""))

  return [0, 2, 4].map((at) => Number.parseInt(hex.slice(at, at + 2), 16))
}

export const darken = (color: string, amount: number): string =>
  `rgba(${channels(color)
    .map((value) => Math.round(value * (1 - amount)))
    .join(", ")}, 1)`

export const alpha = (color: string, opacity: number): string => `rgba(${channels(color).join(", ")}, ${opacity})`
