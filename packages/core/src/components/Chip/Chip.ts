import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, fontSize } from "../../theme/tokens.stylex.ts"
import { chipVars } from "./Chip.stylex.ts"

export type ChipPart = "root" | "label" | "iconWrapper" | "checkIcon"

export type ChipVariant = "filled" | "outline" | "light"

export type ChipSize = keyof typeof sizes

export type ChipOptions = {
  readonly size?: ChipSize
  readonly radius?: StyleValue
  readonly color?: string
  readonly variant?: ChipVariant
  readonly autoContrast?: boolean
}

export type ChipProps<M> = ChipOptions &
  StylesApiProps<ChipPart> & {
    readonly type?: "checkbox" | "radio"
    readonly checked?: boolean
    readonly disabled?: boolean
    readonly readOnly?: boolean
    readonly onChange: (checked: boolean) => M
    readonly onClick?: M
    readonly icon?: Child | false
    readonly name?: string
    readonly value?: string
    readonly children: ReadonlyArray<Child>
  }

export type ChipConfig = ComponentConfig<ChipOptions, ChipPart>

const sizes = stylex.create({
  xs: {
    [chipVars.size]: "23px",
    [chipVars.iconSize]: "9px",
    [chipVars.padding]: "16px",
    [chipVars.checkedPadding]: "8.2px",
    [chipVars.spacing]: "10px",
    [chipVars.fz]: fontSize.xs
  },
  sm: {
    [chipVars.size]: "28px",
    [chipVars.iconSize]: "12px",
    [chipVars.padding]: "20px",
    [chipVars.checkedPadding]: "10px",
    [chipVars.spacing]: "12px",
    [chipVars.fz]: fontSize.sm
  },
  md: {
    [chipVars.size]: "32px",
    [chipVars.iconSize]: "14px",
    [chipVars.padding]: "24px",
    [chipVars.checkedPadding]: "11.7px",
    [chipVars.spacing]: "16px",
    [chipVars.fz]: fontSize.md
  },
  lg: {
    [chipVars.size]: "36px",
    [chipVars.iconSize]: "16px",
    [chipVars.padding]: "28px",
    [chipVars.checkedPadding]: "13.5px",
    [chipVars.spacing]: "20px",
    [chipVars.fz]: fontSize.lg
  },
  xl: {
    [chipVars.size]: "40px",
    [chipVars.iconSize]: "18px",
    [chipVars.padding]: "32px",
    [chipVars.checkedPadding]: "15.7px",
    [chipVars.spacing]: "22px",
    [chipVars.fz]: fontSize.xl
  }
})

const resting = stylex.create({
  outline: {
    backgroundColor: {
      default: `light-dark(${palette.white}, ${palette.dark6})`,
      ":hover": `light-dark(${palette.gray0}, ${palette.dark5})`
    },
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`
  },
  filled: {
    backgroundColor: {
      default: `light-dark(${palette.gray1}, ${palette.dark5})`,
      ":hover": `light-dark(${palette.gray2}, ${palette.dark4})`
    },
    borderColor: "transparent"
  }
})

const checkedVariants = stylex.create({
  outline: {
    backgroundColor: { default: `light-dark(${palette.white}, ${palette.dark6})`, ":hover": accent.outlineHover },
    borderColor: accent.outline
  },
  filled: {
    backgroundColor: { default: accent.filled, ":hover": accent.filledHover },
    borderColor: "transparent",
    color: palette.white
  },
  light: {
    backgroundColor: { default: accent.light, ":hover": accent.lightHover },
    borderColor: "transparent",
    color: accent.lightColor
  }
})

const iconColors = stylex.create({
  outline: { color: accent.outline },
  filled: { color: palette.white },
  light: { color: accent.lightColor }
})

const styles = stylex.create({
  root: { display: "inline-block" },
  label: {
    display: "inline-flex",
    alignItems: "center",
    userSelect: "none",
    borderRadius: chipVars.radius,
    height: chipVars.size,
    fontSize: chipVars.fz,
    fontFamily: "inherit",
    lineHeight: `calc(${chipVars.size} - 2px)`,
    paddingBlock: 0,
    paddingInline: chipVars.padding,
    margin: 0,
    cursor: "pointer",
    whiteSpace: "nowrap",
    WebkitTapHighlightColor: "transparent",
    borderWidth: "1px",
    borderStyle: "solid",
    color: colors.text,
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px"
  },
  checked: { paddingInline: chipVars.checkedPadding },
  disabled: {
    cursor: "not-allowed",
    backgroundColor: colors.disabled,
    borderColor: "transparent",
    color: colors.disabledColor
  },
  readOnly: { cursor: "default" },
  contrast: { color: accent.contrast },
  iconWrapper: {
    width: `calc(${chipVars.iconSize} + (${chipVars.spacing} / 1.5))`,
    maxWidth: `calc(${chipVars.iconSize} + (${chipVars.spacing} / 1.5))`,
    height: chipVars.iconSize,
    display: "flex",
    alignItems: "center",
    overflow: "hidden"
  },
  checkIcon: { width: chipVars.iconSize, height: chipVars.iconSize, display: "block" },
  iconDisabled: { color: colors.disabledColor }
})

const checkPath =
  "M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z"

const restingOf = { outline: resting.outline, filled: resting.filled, light: resting.filled }

export const Chip =
  (config: { readonly Chip?: ChipConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ChipProps<M>): Html => {
    const props = withDefaults(config.Chip, input)
    const getStyles = stylesApi<M, ChipPart>(h, props, config.Chip, "root")
    const variant = props.variant ?? "filled"
    const size = props.size ?? "sm"
    const type = props.type ?? "checkbox"
    const checked = props.checked === true
    const disabled = props.disabled === true
    const interactive = !disabled && props.readOnly !== true
    const message = props.onClick ?? props.onChange(type === "radio" ? true : !checked)
    const clickable = interactive && (type === "checkbox" || !checked || props.onClick !== undefined)
    const checkIcon = h.svg(
      [
        ...getStyles("checkIcon", styles.checkIcon, iconColors[variant], disabled && styles.iconDisabled),
        h.Attribute("viewBox", "0 0 10 7"),
        h.Attribute("fill", "none"),
        h.AriaHidden(true)
      ],
      [
        h.path(
          [
            h.Attribute("d", checkPath),
            h.Attribute("fill", "currentColor"),
            h.Attribute("fill-rule", "evenodd"),
            h.Attribute("clip-rule", "evenodd")
          ],
          []
        )
      ]
    )
    const icon = props.icon === undefined ? checkIcon : props.icon
    const iconView = checked && icon !== false ? [h.span(getStyles("iconWrapper", styles.iconWrapper), [icon])] : []

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          ...accentStyle(props.color, customAccent),
          sizes[size],
          setDefinedVars([chipVars.radius, mapDefined(props.radius, radiusValue)])
        ),
        h.DataAttribute("variant", variant),
        h.DataAttribute("size", size)
      ],
      [
        h.button(
          [
            ...getStyles(
              "label",
              styles.label,
              restingOf[variant],
              checked && checkedVariants[variant],
              checked && props.autoContrast === true && variant === "filled" && styles.contrast,
              checked && styles.checked,
              disabled && styles.disabled,
              props.readOnly === true && styles.readOnly
            ),
            h.Type("button"),
            h.Role(type),
            h.AriaChecked(checked),
            ...(checked ? [h.DataAttribute("checked", "")] : []),
            ...(disabled ? [h.Disabled(true), h.DataAttribute("disabled", "")] : []),
            ...(props.readOnly === true ? [h.AriaReadonly(true)] : []),
            ...(clickable ? [h.OnClick(message)] : [])
          ],
          [...iconView, h.span([], props.children)]
        ),
        ...(props.name === undefined
          ? []
          : [h.input([h.Type("hidden"), h.Name(props.name), h.Value(checked ? (props.value ?? "on") : "")])])
      ]
    )
  }
