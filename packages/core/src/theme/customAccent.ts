import { setVars } from "../styles/StylesApi.ts"
import { contrastColor } from "./contrast.ts"
import { accent } from "./tokens.stylex.ts"

export const customAccent = (value: string) =>
  setVars(
    [accent.filled, value],
    [accent.filledHover, `color-mix(in srgb, ${value}, black 10%)`],
    [accent.light, `color-mix(in srgb, ${value}, transparent 90%)`],
    [accent.lightHover, `color-mix(in srgb, ${value}, transparent 88%)`],
    [accent.lightColor, value],
    [accent.outline, value],
    [accent.outlineHover, `color-mix(in srgb, ${value}, transparent 95%)`],
    [accent.text, value],
    [accent.contrast, contrastColor(value)]
  )
