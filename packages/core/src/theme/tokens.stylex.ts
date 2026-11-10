import * as stylex from "@stylexjs/stylex"
import { palette } from "./palette.stylex.ts"

export const colors = stylex.defineVars({
  white: palette.white,
  black: palette.black,
  text: `light-dark(${palette.black}, ${palette.dark0})`,
  body: `light-dark(${palette.white}, ${palette.dark7})`,
  bright: `light-dark(${palette.black}, ${palette.white})`,
  dimmed: `light-dark(${palette.gray6}, ${palette.dark2})`,
  placeholder: `light-dark(${palette.gray5}, ${palette.dark3})`,
  error: `light-dark(${palette.red6}, ${palette.red8})`,
  success: `light-dark(${palette.teal8}, ${palette.teal8})`,
  anchor: `light-dark(${palette.blue6}, ${palette.blue4})`,
  default: `light-dark(${palette.white}, ${palette.dark6})`,
  defaultHover: `light-dark(${palette.gray0}, ${palette.dark5})`,
  defaultColor: `light-dark(${palette.black}, ${palette.white})`,
  defaultBorder: `light-dark(${palette.gray4}, ${palette.dark4})`,
  disabled: `light-dark(${palette.gray2}, ${palette.dark6})`,
  disabledColor: `light-dark(${palette.gray5}, ${palette.dark3})`,
  disabledBorder: `light-dark(${palette.gray3}, ${palette.dark4})`,
  veil: "light-dark(rgba(255, 255, 255, 0.15), rgba(0, 0, 0, 0.15))"
})

export const accent = stylex.defineVars({
  filled: `light-dark(${palette.blue6}, ${palette.blue8})`,
  filledHover: `light-dark(${palette.blue7}, ${palette.blue9})`,
  light: `light-dark(${palette.blue1}, color-mix(in srgb, ${palette.blue9}, black 50%))`,
  lightHover: `light-dark(${palette.blue2}, color-mix(in srgb, ${palette.blue9}, black 30%))`,
  lightColor: `light-dark(${palette.blue9}, ${palette.blue0})`,
  outline: `light-dark(${palette.blue6}, ${palette.blue4})`,
  outlineHover: `light-dark(color-mix(in srgb, ${palette.blue6}, transparent 95%), color-mix(in srgb, ${palette.blue4}, transparent 95%))`,
  text: `light-dark(${palette.blue6}, ${palette.blue4})`,
  contrast: palette.white
})

export const gradient = stylex.defineVars({
  from: palette.blue6,
  to: palette.cyan6,
  angle: "45deg"
})

export const font = stylex.defineVars({
  body: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji",
  mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace",
  headings:
    "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji"
})

export const fontSize = stylex.defineVars({
  xs: "0.75rem",
  sm: "0.875rem",
  md: "1rem",
  lg: "1.125rem",
  xl: "1.25rem"
})

export const lineHeight = stylex.defineVars({
  xs: "1.4",
  sm: "1.45",
  md: "1.55",
  lg: "1.6",
  xl: "1.65"
})

export const fontWeight = stylex.defineVars({
  regular: "400",
  medium: "600",
  bold: "700"
})

export const heading = stylex.defineVars({
  weight: "700",
  wrap: "wrap",
  h1Size: "2.125rem",
  h1Line: "1.3",
  h2Size: "1.625rem",
  h2Line: "1.35",
  h3Size: "1.375rem",
  h3Line: "1.4",
  h4Size: "1.125rem",
  h4Line: "1.45",
  h5Size: "1rem",
  h5Line: "1.5",
  h6Size: "0.875rem",
  h6Line: "1.5"
})

export const space = stylex.defineVars({
  xs: "0.625rem",
  sm: "0.75rem",
  md: "1rem",
  lg: "1.25rem",
  xl: "2rem"
})

export const radius = stylex.defineVars({
  xs: "0.125rem",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "1rem",
  xl: "2rem",
  default: "0.5rem"
})

export const shadow = stylex.defineVars({
  xs: "0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), 0 0.0625rem 0.125rem rgba(0, 0, 0, 0.1)",
  sm: "0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 0.625rem 0.9375rem -0.3125rem, rgba(0, 0, 0, 0.04) 0 0.4375rem 0.4375rem -0.3125rem",
  md: "0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 1.25rem 1.5625rem -0.3125rem, rgba(0, 0, 0, 0.04) 0 0.625rem 0.625rem -0.3125rem",
  lg: "0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 1.75rem 1.4375rem -0.4375rem, rgba(0, 0, 0, 0.04) 0 0.75rem 0.75rem -0.4375rem",
  xl: "0 0.0625rem 0.1875rem rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.05) 0 2.25rem 1.75rem -0.4375rem, rgba(0, 0, 0, 0.04) 0 1.0625rem 1.0625rem -0.4375rem"
})

export const zIndex = stylex.defineVars({
  app: "100",
  modal: "200",
  popover: "300",
  overlay: "400",
  max: "9999"
})
