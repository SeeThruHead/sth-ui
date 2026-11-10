import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius } from "../../theme/tokens.stylex.ts"
import { toggleVars } from "./Toggle.stylex.ts"

export type TogglePart = "root"

export type ToggleSize = "xs" | "sm" | "md" | "lg" | "xl"

export type ToggleVariant = "filled" | "light" | "outline" | "subtle" | "transparent" | "default" | "white"

export type ToggleOptions = {
  readonly variant?: ToggleVariant
  readonly size?: ToggleSize | number | (string & {})
  readonly radius?: StyleValue
  readonly color?: string
  readonly autoContrast?: boolean
  readonly autoWidth?: boolean
}

export type ToggleProps<M> = ToggleOptions &
  StylesApiProps<TogglePart> & {
    readonly active: boolean
    readonly onActiveChange?: (active: boolean) => M
    readonly disabled?: boolean
    readonly ariaLabel?: string
    readonly children: ReadonlyArray<Child>
  }

export type ToggleConfig = ComponentConfig<ToggleOptions, TogglePart>

const sizes: ReadonlyMap<string, string> = new Map([
  ["xs", "22px"],
  ["sm", "26px"],
  ["md", "30px"],
  ["lg", "36px"],
  ["xl", "42px"]
])

const sizeOf = (size: number | string): string =>
  typeof size === "string" ? (sizes.get(size) ?? size) : sizeValue(size)

const styles = stylex.create({
  root: {
    [toggleVars.radius]: radius.default,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: "1px",
    borderStyle: "solid",
    borderRadius: toggleVars.radius,
    cursor: "pointer",
    appearance: "none",
    textDecoration: "none",
    lineHeight: 1,
    userSelect: "none",
    fontSize: fontSize.xs,
    width: toggleVars.size,
    minWidth: toggleVars.size,
    height: toggleVars.size,
    paddingBlock: `calc(${toggleVars.size} / 5)`,
    paddingInline: `calc(${toggleVars.size} / 5)`,
    fontWeight: fontWeight.medium,
    font: "inherit",
    backgroundColor: {
      default: `light-dark(${palette.white}, ${palette.dark6})`,
      ":hover": `light-dark(${palette.gray0}, ${palette.dark5})`
    },
    borderColor: `light-dark(${palette.gray4}, ${palette.dark4})`,
    color: `light-dark(${palette.gray7}, ${palette.dark1})`,
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: { default: null, ":focus-visible": "2px" }
  },
  autoWidth: { width: "auto", paddingBlock: 0, paddingInline: `calc(${toggleVars.size} / 4)` },
  active: { borderColor: "transparent" },
  disabled: {
    cursor: "not-allowed",
    color: colors.disabledColor,
    backgroundColor: { default: colors.disabled, ":hover": colors.disabled },
    borderColor: "transparent"
  },
  disabledActive: {
    backgroundColor: {
      default: `light-dark(${palette.gray4}, ${palette.dark4})`,
      ":hover": `light-dark(${palette.gray4}, ${palette.dark4})`
    },
    color: `light-dark(${palette.gray6}, ${palette.dark2})`
  },
  contrast: { color: accent.contrast }
})

const activeVariants = stylex.create({
  filled: { backgroundColor: { default: accent.filled, ":hover": accent.filledHover }, color: colors.white },
  light: { backgroundColor: { default: accent.light, ":hover": accent.lightHover }, color: accent.lightColor },
  outline: {
    backgroundColor: { default: "transparent", ":hover": accent.outlineHover },
    color: accent.outline,
    borderColor: accent.outline
  },
  subtle: { backgroundColor: { default: "transparent", ":hover": accent.lightHover }, color: accent.lightColor },
  transparent: { backgroundColor: { default: "transparent", ":hover": "transparent" }, color: accent.lightColor },
  default: {
    backgroundColor: { default: colors.default, ":hover": colors.defaultHover },
    color: colors.defaultColor,
    borderColor: colors.defaultBorder
  },
  white: { backgroundColor: { default: colors.white, ":hover": colors.white }, color: accent.filled }
})

export const Toggle =
  (config: { readonly Toggle?: ToggleConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ToggleProps<M>): Html => {
    const props = withDefaults(config.Toggle, input)
    const getStyles = stylesApi<M, TogglePart>(h, props, config.Toggle, "root")
    const variant = props.variant ?? "filled"
    const disabled = props.disabled === true
    const active = props.active

    return h.button(
      [
        ...getStyles(
          "root",
          ...accentStyle(props.color, customAccent),
          styles.root,
          props.autoWidth === true && styles.autoWidth,
          active && styles.active,
          active && activeVariants[variant],
          active && variant === "filled" && props.autoContrast === true && styles.contrast,
          disabled && styles.disabled,
          disabled && active && styles.disabledActive,
          setDefinedVars(
            [toggleVars.size, mapDefined(props.size, sizeOf)],
            [toggleVars.radius, mapDefined(props.radius, radiusValue)]
          )
        ),
        h.Type("button"),
        h.DataAttribute("variant", variant),
        h.AriaPressed(active ? "true" : "false"),
        ...(active ? [h.DataAttribute("active", "")] : []),
        ...(disabled ? [h.DataAttribute("disabled", ""), h.Disabled(true), h.AriaDisabled(true), h.Tabindex(-1)] : []),
        ...(props.autoWidth === true ? [h.DataAttribute("auto-width", "")] : []),
        ...(props.ariaLabel === undefined ? [] : [h.AriaLabel(props.ariaLabel)]),
        ...(props.onActiveChange === undefined || disabled ? [] : [h.OnClick(props.onActiveChange(!active))])
      ],
      props.children
    )
  }
