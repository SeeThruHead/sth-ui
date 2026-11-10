import { setVars } from "../styles/inline.ts"
import { colorValue, isAccentName } from "./accent.ts"
import { gradient } from "./tokens.stylex.ts"

export type Gradient = { readonly from: string; readonly to: string; readonly deg?: number }

const gradientEnd = (color: string): string => (isAccentName(color) ? colorValue(`${color}.6`) : colorValue(color))

export const gradientStyle = (value: Gradient | undefined) =>
  value === undefined
    ? null
    : setVars(
        [gradient.from, gradientEnd(value.from)],
        [gradient.to, gradientEnd(value.to)],
        [gradient.angle, `${value.deg ?? 0}deg`]
      )
