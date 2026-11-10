import { alpha, darken, isLightColor } from "./color.ts"

const shade = (name: string, index: number): string => `\${palette.${name}${index}}`

const hexOf = (shades: ReadonlyArray<string>, index: number): string => shades[index] ?? "#000"

const lightDark = (light: string, dark: string): string => `light-dark(${light}, ${dark})`

export const accentSlots = (name: string, shades: ReadonlyArray<string>): ReadonlyArray<readonly [string, string]> => [
  ["filled", lightDark(shade(name, 6), shade(name, 8))],
  ["filledHover", lightDark(shade(name, 7), shade(name, 9))],
  ["light", lightDark(shade(name, 1), darken(hexOf(shades, 9), 0.5))],
  ["lightHover", lightDark(shade(name, 2), darken(hexOf(shades, 9), 0.3))],
  ["lightColor", lightDark(shade(name, 9), shade(name, 0))],
  ["outline", lightDark(shade(name, 6), shade(name, 4))],
  ["outlineHover", lightDark(alpha(hexOf(shades, 6), 0.05), alpha(hexOf(shades, 4), 0.05))],
  ["text", lightDark(shade(name, 6), shade(name, 4))],
  ["contrast", isLightColor(hexOf(shades, 6), 0.3) ? "#000" : "#fff"]
]
