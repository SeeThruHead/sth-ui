import { Predicate } from "effect"
import * as stylex from "@stylexjs/stylex"
import { childAttributes } from "foldkit/html"
import type { ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { shared } from "../../styles/shared.ts"
import { setDefinedVars, setVars, stylesApi, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { gradientStyle } from "../../theme/gradient.ts"
import type { Gradient } from "../../theme/gradient.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { accent, colors, fontSize, fontWeight, gradient, radius, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { Loader } from "../Loader/Loader.ts"
import type { LoaderConfig, LoaderProps } from "../Loader/Loader.ts"
import { buttonBehaviour } from "../UnstyledButton/UnstyledButton.ts"
import type { ButtonBehaviour } from "../UnstyledButton/UnstyledButton.ts"
import { buttonVars } from "./Button.stylex.ts"

export type ButtonPart = "root" | "inner" | "loader" | "section" | "label"

export type ButtonVariant = keyof typeof variants

export type ButtonSize = keyof typeof sizes

export type ButtonRadius = keyof typeof radii

export type ButtonSlot = "leftSection" | "label" | "rightSection"

export type GroupPosition = "only" | "first" | "middle" | "last"

export type GroupOrientation = "horizontal" | "vertical"

export type ButtonGradient = Gradient

export type ButtonOptions = {
  readonly size?: ButtonSize
  readonly color?: string
  readonly variant?: ButtonVariant
  readonly justify?: "center" | "space-between" | "flex-start" | "flex-end"
  readonly fullWidth?: boolean
  readonly radius?: ButtonRadius | number
  readonly gradient?: ButtonGradient
  readonly disabled?: boolean
  readonly loading?: boolean
  readonly autoContrast?: boolean
  readonly order?: ReadonlyArray<ButtonSlot>
}

export type ButtonProps<M> = ButtonOptions &
  ButtonBehaviour<M> &
  StylesApiProps<ButtonPart> & {
    readonly leftSection?: Child
    readonly rightSection?: Child
    readonly loaderProps?: LoaderProps
    readonly groupPosition?: GroupPosition
    readonly groupOrientation?: GroupOrientation
    readonly renderRoot?: RenderRoot
    readonly children: ReadonlyArray<Child>
  }

export type ButtonConfig = ComponentConfig<ButtonOptions, ButtonPart>

export type RenderRoot = (attributes: ReadonlyArray<ChildAttribute>, children: ReadonlyArray<Html>) => Html

const styles = stylex.create({
  root: {
    [buttonVars.height]: "36px",
    [buttonVars.paddingX]: "18px",
    [buttonVars.fontSize]: fontSize.sm,
    [buttonVars.radius]: radius.default,
    [buttonVars.justify]: "center",
    appearance: "none",
    boxSizing: "border-box",
    textDecoration: "none",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
    fontFamily: "inherit",
    fontWeight: fontWeight.medium,
    position: "relative",
    lineHeight: 1,
    textAlign: "center",
    overflow: "hidden",
    width: "auto",
    cursor: "pointer",
    display: "inline-block",
    verticalAlign: "middle",
    borderRadius: buttonVars.radius,
    fontSize: buttonVars.fontSize,
    height: buttonVars.height,
    paddingBlock: 0,
    paddingInline: buttonVars.paddingX,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "transparent"
  },
  block: { display: "block", width: "100%" },
  withLeft: { paddingInlineStart: `calc(${buttonVars.paddingX} / 1.5)` },
  withRight: { paddingInlineEnd: `calc(${buttonVars.paddingX} / 1.5)` },
  contrast: { color: accent.contrast },
  disabled: {
    cursor: "not-allowed",
    transform: "none",
    borderColor: "transparent",
    color: colors.disabledColor,
    backgroundColor: { default: colors.disabled, ":hover": colors.disabled },
    backgroundImage: "none"
  },
  loading: { cursor: "not-allowed", transform: "none" },
  veil: {
    pointerEvents: "none",
    position: "absolute",
    inset: "-1px",
    borderRadius: buttonVars.radius,
    filter: "blur(12px)",
    backgroundColor: colors.veil
  },
  inner: {
    display: "flex",
    alignItems: "center",
    justifyContent: buttonVars.justify,
    height: "100%",
    overflow: "visible",
    transition: "transform 150ms ease, opacity 100ms ease"
  },
  innerLoading: { opacity: 0, transform: "translateY(100%)" },
  label: { whiteSpace: "nowrap", height: "100%", overflow: "hidden", display: "flex", alignItems: "center" },
  section: { display: "flex", alignItems: "center" },
  sectionLeft: { marginInlineEnd: space.xs },
  sectionRight: { marginInlineStart: space.xs },
  loader: { position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, calc(-50% + 1px))" }
})

export const variants = stylex.create({
  filled: {
    backgroundColor: { default: accent.filled, ":hover": accent.filledHover },
    color: colors.white
  },
  light: {
    backgroundColor: { default: accent.light, ":hover": accent.lightHover },
    color: accent.lightColor
  },
  outline: {
    backgroundColor: { default: "transparent", ":hover": accent.outlineHover },
    color: accent.outline,
    borderColor: accent.outline
  },
  subtle: {
    backgroundColor: { default: "transparent", ":hover": accent.lightHover },
    color: accent.lightColor
  },
  transparent: { backgroundColor: "transparent", color: accent.lightColor },
  white: {
    backgroundColor: { default: colors.white, ":hover": `color-mix(in srgb, ${colors.white}, black 1%)` },
    color: accent.filled
  },
  default: {
    backgroundColor: { default: colors.default, ":hover": colors.defaultHover },
    color: colors.defaultColor,
    borderColor: colors.defaultBorder
  },
  gradient: {
    backgroundImage: `linear-gradient(${gradient.angle}, ${gradient.from} 0%, ${gradient.to} 100%)`,
    color: colors.white,
    borderWidth: 0
  }
})

export const sizes = stylex.create({
  xs: { [buttonVars.height]: "30px", [buttonVars.paddingX]: "14px", [buttonVars.fontSize]: fontSize.xs },
  sm: { [buttonVars.height]: "36px", [buttonVars.paddingX]: "18px", [buttonVars.fontSize]: fontSize.sm },
  md: { [buttonVars.height]: "42px", [buttonVars.paddingX]: "22px", [buttonVars.fontSize]: fontSize.md },
  lg: { [buttonVars.height]: "50px", [buttonVars.paddingX]: "26px", [buttonVars.fontSize]: fontSize.lg },
  xl: { [buttonVars.height]: "60px", [buttonVars.paddingX]: "32px", [buttonVars.fontSize]: fontSize.xl },
  "compact-xs": { [buttonVars.height]: "22px", [buttonVars.paddingX]: "7px", [buttonVars.fontSize]: fontSize.xs },
  "compact-sm": { [buttonVars.height]: "26px", [buttonVars.paddingX]: "8px", [buttonVars.fontSize]: fontSize.sm },
  "compact-md": { [buttonVars.height]: "30px", [buttonVars.paddingX]: "10px", [buttonVars.fontSize]: fontSize.md },
  "compact-lg": { [buttonVars.height]: "34px", [buttonVars.paddingX]: "12px", [buttonVars.fontSize]: fontSize.lg },
  "compact-xl": { [buttonVars.height]: "40px", [buttonVars.paddingX]: "14px", [buttonVars.fontSize]: fontSize.xl }
})

export const radii = stylex.create({
  xs: { [buttonVars.radius]: radius.xs },
  sm: { [buttonVars.radius]: radius.sm },
  md: { [buttonVars.radius]: radius.md },
  lg: { [buttonVars.radius]: radius.lg },
  xl: { [buttonVars.radius]: radius.xl }
})

export const groupStyles = stylex.create({
  horizontalFirst: {
    borderEndEndRadius: 0,
    borderStartEndRadius: 0,
    borderInlineEndWidth: `calc(${buttonVars.groupBorderWidth} / 2)`
  },
  horizontalLast: {
    borderEndStartRadius: 0,
    borderStartStartRadius: 0,
    borderInlineStartWidth: `calc(${buttonVars.groupBorderWidth} / 2)`
  },
  horizontalMiddle: {
    borderRadius: 0,
    borderInlineStartWidth: `calc(${buttonVars.groupBorderWidth} / 2)`,
    borderInlineEndWidth: `calc(${buttonVars.groupBorderWidth} / 2)`
  },
  verticalFirst: {
    borderEndStartRadius: 0,
    borderEndEndRadius: 0,
    borderBottomWidth: `calc(${buttonVars.groupBorderWidth} / 2)`
  },
  verticalLast: {
    borderStartStartRadius: 0,
    borderStartEndRadius: 0,
    borderTopWidth: `calc(${buttonVars.groupBorderWidth} / 2)`
  },
  verticalMiddle: {
    borderRadius: 0,
    borderBottomWidth: `calc(${buttonVars.groupBorderWidth} / 2)`,
    borderTopWidth: `calc(${buttonVars.groupBorderWidth} / 2)`
  },
  focused: { position: { default: null, ":focus": "relative" }, zIndex: { default: null, ":focus": 1 } }
})

export const groupPositionStyle = (position: GroupPosition | undefined, orientation: GroupOrientation | undefined) => {
  if (position === undefined || position === "only") return null
  const vertical = orientation === "vertical"
  if (position === "first") return vertical ? groupStyles.verticalFirst : groupStyles.horizontalFirst
  if (position === "last") return vertical ? groupStyles.verticalLast : groupStyles.horizontalLast

  return vertical ? groupStyles.verticalMiddle : groupStyles.horizontalMiddle
}

export const radiusStyle = (value: ButtonOptions["radius"]) => {
  if (value === undefined) return null
  if (Predicate.isNumber(value)) return setVars([buttonVars.radius, rem(value)])

  return radii[value]
}

const defaultOrder: ReadonlyArray<ButtonSlot> = ["leftSection", "label", "rightSection"]

export const Button = (config: { readonly Button?: ButtonConfig; readonly Loader?: LoaderConfig }) => {
  const loader = Loader(config)

  return <M>(h: HtmlBuilder<M>, input: ButtonProps<M>): Html => {
    const props = withDefaults(config.Button, input)
    const getStyles = stylesApi<M, ButtonPart>(h, props, config.Button, "root")
    const disabled = props.disabled === true
    const loading = props.loading === true
    const slot = (name: ButtonSlot): ReadonlyArray<Html> => {
      if (name === "label") {
        return [
          h.span(
            [...getStyles("label", styles.label), ...(loading ? [h.DataAttribute("loading", "")] : [])],
            props.children
          )
        ]
      }
      const content = name === "leftSection" ? props.leftSection : props.rightSection
      if (content === undefined) return []
      const side = name === "leftSection" ? styles.sectionLeft : styles.sectionRight

      const position = name === "leftSection" ? "left" : "right"

      return [h.span([...getStyles("section", styles.section, side), h.DataAttribute("position", position)], [content])]
    }
    const loaderView = loading
      ? [
          h.span([...sx(h, styles.veil), h.AriaHidden(true)], []),
          h.span(
            [...getStyles("loader", styles.loader), h.AriaHidden(true)],
            [loader(h, { color: "currentColor", size: `calc(${buttonVars.height} / 1.8)`, ...props.loaderProps })]
          )
        ]
      : []
    const attributes = [
      ...getStyles(
        "root",
        ...accentStyle(props.color, customAccent),
        styles.root,
        props.size === undefined ? null : sizes[props.size],
        radiusStyle(props.radius),
        setDefinedVars([buttonVars.justify, props.justify]),
        gradientStyle(props.gradient),
        variants[props.variant ?? "filled"],
        props.autoContrast === true && (props.variant ?? "filled") === "filled" && styles.contrast,
        shared.focusRing,
        !disabled && !loading && shared.active,
        props.fullWidth === true && styles.block,
        props.leftSection !== undefined && styles.withLeft,
        props.rightSection !== undefined && styles.withRight,
        disabled && styles.disabled,
        loading && styles.loading,
        groupPositionStyle(props.groupPosition, props.groupOrientation),
        props.groupPosition !== undefined && groupStyles.focused
      ),
      ...buttonBehaviour(h, { ...props, disabled: disabled || loading }),
      ...(loading ? [h.AriaBusy(true), h.DataAttribute("loading", "")] : []),
      ...(disabled ? [h.DataAttribute("disabled", "")] : []),
      ...(props.fullWidth === true ? [h.DataAttribute("block", "")] : []),
      ...(props.leftSection === undefined ? [] : [h.DataAttribute("with-left-section", "")]),
      ...(props.rightSection === undefined ? [] : [h.DataAttribute("with-right-section", "")])
    ]
    const children = [
      ...loaderView,
      h.span(
        getStyles("inner", styles.inner, loading && styles.innerLoading),
        (props.order ?? defaultOrder).flatMap(slot)
      )
    ]
    if (props.renderRoot !== undefined) return props.renderRoot(childAttributes(attributes), children)

    return h[props.component ?? "button"](attributes, children)
  }
}
