import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps, Sx } from "../../styles/StylesApi.ts"
import { gradientStyle } from "../../theme/gradient.ts"
import type { Gradient } from "../../theme/gradient.ts"
import { fontSize, fontWeight, gradient, lineHeight } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import type { BoxElement } from "../Box/Box.ts"
import { textVars } from "./Text.stylex.ts"

export type TextPart = "root"

export type TextSize = keyof typeof sizes

export type TextTruncate = "end" | "start" | boolean

export type TextWrap = keyof typeof wraps

export type TextOptions = {
  readonly size?: TextSize | number
  readonly variant?: "text" | "gradient"
  readonly gradient?: Gradient
  readonly lineClamp?: number
  readonly truncate?: TextTruncate
  readonly inline?: boolean
  readonly inherit?: boolean
  readonly span?: boolean
  readonly textWrap?: TextWrap
  readonly component?: BoxElement
}

export type TextProps = TextOptions & StylesApiProps<TextPart> & { readonly children: ReadonlyArray<Child> }

export type TextConfig = ComponentConfig<TextOptions, TextPart>

const styles = stylex.create({
  root: {
    WebkitTapHighlightColor: "transparent",
    textDecoration: "none",
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: fontWeight.regular,
    margin: 0,
    padding: 0
  },
  truncate: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  truncateStart: { direction: "rtl", textAlign: "end" },
  gradient: {
    backgroundImage: `linear-gradient(${gradient.angle}, ${gradient.from} 0%, ${gradient.to} 100%)`,
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  lineClamp: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    WebkitLineClamp: textVars.lineClamp,
    WebkitBoxOrient: "vertical"
  },
  inherit: { lineHeight: "inherit", fontWeight: "inherit", fontSize: "inherit" },
  inline: { lineHeight: 1 }
})

const sizes = stylex.create({
  xs: { fontSize: fontSize.xs, lineHeight: lineHeight.xs },
  sm: { fontSize: fontSize.sm, lineHeight: lineHeight.sm },
  md: { fontSize: fontSize.md, lineHeight: lineHeight.md },
  lg: { fontSize: fontSize.lg, lineHeight: lineHeight.lg },
  xl: { fontSize: fontSize.xl, lineHeight: lineHeight.xl }
})

export const wraps = stylex.create({
  wrap: { textWrap: "wrap" },
  nowrap: { textWrap: "nowrap" },
  balance: { textWrap: "balance" },
  pretty: { textWrap: "pretty" },
  stable: { textWrap: "stable" }
})

const sizeStyle = (size: TextOptions["size"]) => {
  if (size === undefined) return null
  if (Predicate.isNumber(size)) return setVars([fontSize.md, rem(size)])

  return sizes[size]
}

const truncateStyles = (truncate: TextTruncate | undefined) => {
  if (truncate === undefined || truncate === false) return []
  if (truncate === "start") return [styles.truncate, styles.truncateStart]

  return [styles.truncate]
}

export const clampStyles = (lineClamp: number | undefined): ReadonlyArray<Sx> =>
  lineClamp === undefined ? [] : [styles.lineClamp, setVars([textVars.lineClamp, String(lineClamp)])]

const elementOf = (props: TextOptions): BoxElement => props.component ?? (props.span === true ? "span" : "p")

export const textStyles = (props: TextOptions): ReadonlyArray<Sx> => {
  const gradientVariant = props.variant === "gradient"

  return [
    styles.root,
    sizeStyle(props.size),
    ...truncateStyles(props.truncate),
    gradientVariant && styles.gradient,
    gradientVariant ? gradientStyle(props.gradient) : null,
    ...clampStyles(props.lineClamp),
    props.inherit === true && styles.inherit,
    props.inline === true && styles.inline,
    props.textWrap === undefined ? null : wraps[props.textWrap]
  ]
}

const truncateValue = (truncate: TextTruncate | undefined): string | undefined => {
  if (truncate === undefined || truncate === false) return undefined

  return truncate === "start" ? "start" : "end"
}

export const textModifiers = (props: TextOptions) => ({
  truncate: truncateValue(props.truncate),
  lineClamp: props.lineClamp !== undefined,
  inline: props.inline === true,
  inherit: props.inherit === true
})

export const Text =
  (config: { readonly Text?: TextConfig }) =>
  <M>(h: HtmlBuilder<M>, input: TextProps): Html => {
    const props = withDefaults(config.Text, input)
    const getStyles = stylesApi<M, TextPart>(h, props, config.Text, "root")

    const modifiers = textModifiers(props)

    return h[elementOf(props)](
      [
        ...getStyles("root", ...textStyles(props)),
        ...(modifiers.truncate === undefined ? [] : [h.DataAttribute("truncate", modifiers.truncate)]),
        ...(modifiers.lineClamp ? [h.DataAttribute("line-clamp", "")] : []),
        ...(modifiers.inline ? [h.DataAttribute("inline", "")] : []),
        ...(modifiers.inherit ? [h.DataAttribute("inherit", "")] : [])
      ],
      props.children
    )
  }
