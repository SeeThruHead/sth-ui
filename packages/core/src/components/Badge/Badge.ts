import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import { setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { gradientStyle } from "../../theme/gradient.ts"
import type { Gradient } from "../../theme/gradient.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { staticVariants } from "../../theme/staticVariants.ts"
import { accent, fontWeight, space } from "../../theme/tokens.stylex.ts"
import type { BoxElement } from "../Box/Box.ts"
import { badgeVars } from "./Badge.stylex.ts"

export type BadgePart = "root" | "section" | "label"

export type BadgeVariant = keyof typeof variants

export type BadgeSize = keyof typeof sizes

export type BadgeOptions = {
  readonly size?: BadgeSize | (string & {})
  readonly variant?: BadgeVariant
  readonly color?: string
  readonly radius?: string | number
  readonly gradient?: Gradient
  readonly circle?: boolean
  readonly fullWidth?: boolean
  readonly autoContrast?: boolean
  readonly component?: BoxElement
}

export type BadgeProps = BadgeOptions &
  StylesApiProps<BadgePart> & {
    readonly leftSection?: Child
    readonly rightSection?: Child
    readonly children: ReadonlyArray<Child>
  }

export type BadgeConfig = ComponentConfig<BadgeOptions, BadgePart>

const styles = stylex.create({
  root: {
    WebkitTapHighlightColor: "transparent",
    fontSize: badgeVars.fontSize,
    borderRadius: badgeVars.radius,
    height: badgeVars.height,
    lineHeight: `calc(${badgeVars.height} - 2px)`,
    textDecoration: "none",
    paddingBlock: 0,
    paddingInline: badgeVars.paddingX,
    display: "inline-grid",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    textTransform: "uppercase",
    fontWeight: fontWeight.bold,
    letterSpacing: "0.25px",
    cursor: "default",
    textOverflow: "ellipsis",
    overflow: "hidden",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent"
  },
  block: { display: "flex", width: "100%" },
  circle: { paddingInline: "2px", display: "flex", width: badgeVars.height },
  contrast: { color: accent.contrast },
  label: { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center", cursor: "inherit" },
  section: {
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    maxHeight: `calc(${badgeVars.height} - 2px)`
  },
  sectionLeft: { marginInlineEnd: `calc(${space.xs} / 2)` },
  sectionRight: { marginInlineStart: `calc(${space.xs} / 2)` },
  dot: {
    display: "block",
    width: `calc(${badgeVars.height} / 3.4)`,
    height: `calc(${badgeVars.height} / 3.4)`,
    borderRadius: `calc(${badgeVars.height} / 3.4)`,
    backgroundColor: accent.filled,
    marginInlineEnd: `calc(${badgeVars.height} / 3.4)`
  }
})

const dotVariant = stylex.create({
  dot: {
    backgroundColor: `light-dark(${palette.white}, ${palette.dark5})`,
    borderColor: `light-dark(${palette.gray4}, ${palette.dark5})`,
    color: `light-dark(${palette.black}, ${palette.white})`
  }
})

export const variants = { ...staticVariants, dot: dotVariant.dot }

export const sizes = stylex.create({
  xs: { [badgeVars.height]: "16px", [badgeVars.fontSize]: "9px", [badgeVars.paddingX]: "6px" },
  sm: { [badgeVars.height]: "18px", [badgeVars.fontSize]: "10px", [badgeVars.paddingX]: "8px" },
  md: { [badgeVars.height]: "20px", [badgeVars.fontSize]: "11px", [badgeVars.paddingX]: "10px" },
  lg: { [badgeVars.height]: "26px", [badgeVars.fontSize]: "13px", [badgeVars.paddingX]: "12px" },
  xl: { [badgeVars.height]: "32px", [badgeVars.fontSize]: "16px", [badgeVars.paddingX]: "16px" }
})

const columns = stylex.create({
  "false-false-false": { gridTemplateColumns: "1fr" },
  "true-false-false": { gridTemplateColumns: "auto 1fr" },
  "false-true-false": { gridTemplateColumns: "auto 1fr" },
  "true-true-false": { gridTemplateColumns: "auto auto 1fr" },
  "false-false-true": { gridTemplateColumns: "1fr auto" },
  "true-false-true": { gridTemplateColumns: "auto 1fr auto" },
  "false-true-true": { gridTemplateColumns: "auto 1fr auto" },
  "true-true-true": { gridTemplateColumns: "auto auto 1fr auto" }
})

const isBadgeSize = (size: string): size is BadgeSize => Object.hasOwn(sizes, size)

const sizeStyle = (size: BadgeOptions["size"]) => {
  if (size === undefined) return null
  if (isBadgeSize(size)) return sizes[size]
  const value = sizeValue(size)

  return setVars([badgeVars.height, value], [badgeVars.fontSize, value], [badgeVars.paddingX, value])
}

const radiusStyle = (props: BadgeOptions) => {
  if (props.circle === true || props.radius === undefined) return null

  return setVars([badgeVars.radius, radiusValue(props.radius)])
}

export const Badge =
  (config: { readonly Badge?: BadgeConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BadgeProps): Html => {
    const props = withDefaults(config.Badge, input)
    const getStyles = stylesApi<M, BadgePart>(h, props, config.Badge, "root")
    const variant = props.variant ?? "filled"
    const dot = variant === "dot"
    const left = props.leftSection !== undefined
    const right = props.rightSection !== undefined
    const section = (content: Child, position: "left" | "right"): Html =>
      h.span(
        [
          ...getStyles("section", styles.section, position === "left" ? styles.sectionLeft : styles.sectionRight),
          h.DataAttribute("position", position)
        ],
        [content]
      )

    return h[props.component ?? "div"](
      [
        ...getStyles(
          "root",
          ...accentStyle(props.color, customAccent),
          styles.root,
          sizeStyle(props.size),
          radiusStyle(props),
          gradientStyle(props.gradient),
          variants[variant],
          columns[`${dot}-${left}-${right}`],
          props.autoContrast === true && variant === "filled" && styles.contrast,
          props.fullWidth === true && styles.block,
          props.circle === true && styles.circle
        ),
        h.DataAttribute("variant", variant),
        ...(props.fullWidth === true ? [h.DataAttribute("block", "")] : []),
        ...(props.circle === true ? [h.DataAttribute("circle", "")] : []),
        ...(left ? [h.DataAttribute("with-left-section", "")] : []),
        ...(right ? [h.DataAttribute("with-right-section", "")] : [])
      ],
      [
        ...(dot ? [h.span([...sx(h, styles.dot), h.AriaHidden(true)], [])] : []),
        ...(props.leftSection === undefined ? [] : [section(props.leftSection, "left")]),
        h.span(getStyles("label", styles.label), props.children),
        ...(props.rightSection === undefined ? [] : [section(props.rightSection, "right")])
      ]
    )
  }
