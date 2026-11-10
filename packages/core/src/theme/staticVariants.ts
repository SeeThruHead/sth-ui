import * as stylex from "@stylexjs/stylex"
import { accent, colors, gradient } from "./tokens.stylex.ts"

export const staticVariants = stylex.create({
  filled: { backgroundColor: accent.filled, color: colors.white },
  light: { backgroundColor: accent.light, color: accent.lightColor },
  outline: { backgroundColor: "transparent", color: accent.outline, borderColor: accent.outline },
  transparent: { backgroundColor: "transparent", color: accent.lightColor },
  white: { backgroundColor: colors.white, color: accent.filled },
  default: { backgroundColor: colors.default, color: colors.defaultColor, borderColor: colors.defaultBorder },
  gradient: {
    backgroundImage: `linear-gradient(${gradient.angle}, ${gradient.from} 0%, ${gradient.to} 100%)`,
    color: colors.white,
    borderWidth: 0
  }
})

export type StaticVariant = keyof typeof staticVariants
