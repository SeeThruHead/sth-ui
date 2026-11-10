import { Option, Predicate } from "effect"
import type { Sx } from "../styles/StylesApi.ts"
import { accents, filledColors } from "./accents.ts"
import type { AccentName } from "./accents.ts"
import { palette } from "./palette.stylex.ts"

const shades = new Map<string, string>(
  Object.entries(palette).filter((entry): entry is [string, string] => Predicate.isString(entry[1]))
)

const baseName = (color: string): string => color.split(".", 1).join("")

export const isAccentName = (color: string): color is AccentName => Object.hasOwn(accents, color)

export const shadeValue = (color: string): Option.Option<string> =>
  color.includes(".") ? Option.fromNullishOr(shades.get(color.replace(".", ""))) : Option.none()

export const colorValue = (color: string): string => Option.getOrElse(shadeValue(color), () => color)

export const accentStyle = (color: string | undefined, custom: (value: string) => Sx): ReadonlyArray<Sx> => {
  if (color === undefined) return []
  if (isAccentName(color)) return [accents[color]]
  const shade = shadeValue(color)
  if (Option.isSome(shade)) return [custom(shade.value)]
  const name = baseName(color)

  return isAccentName(name) ? [accents[name]] : [custom(color)]
}

export const themeColor = (color: string): string => (isAccentName(color) ? filledColors[color] : colorValue(color))
