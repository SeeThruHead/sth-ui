import { mantinePalette } from "../../tools/mantinePalette.ts"

export type Rgb = ReadonlyArray<number>

const channels = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16)

  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const darken = (hex: string, amount: number): Rgb => channels(hex).map((channel) => Math.round(channel * (1 - amount)))

export const mantineColorNames = Object.keys(mantinePalette)

const shadeOf = (name: string, index: number): string => mantinePalette[name]?.[index] ?? "#000000"

export const mantineSlots = (name: string, scheme: "light" | "dark") =>
  scheme === "light"
    ? {
        filled: channels(shadeOf(name, 6)),
        light: channels(shadeOf(name, 1)),
        lightHover: channels(shadeOf(name, 2)),
        lightColor: channels(shadeOf(name, 9)),
        outline: channels(shadeOf(name, 6))
      }
    : {
        filled: channels(shadeOf(name, 8)),
        light: darken(shadeOf(name, 9), 0.5),
        lightHover: darken(shadeOf(name, 9), 0.3),
        lightColor: channels(shadeOf(name, 0)),
        outline: channels(shadeOf(name, 4))
      }

export const parseColor = (value: string): Rgb => {
  const srgb = /^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)/.exec(value)
  if (srgb !== null) return [1, 2, 3].map((index) => Math.round(Number(srgb[index]) * 255))
  const rgb = /^rgba?\((\d+), (\d+), (\d+)/.exec(value)

  return [1, 2, 3].map((index) => Number(rgb?.[index] ?? Number.NaN))
}
