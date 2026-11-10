import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle, themeColor } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors, radius } from "../../theme/tokens.stylex.ts"
import type { InlineInputSize } from "../InlineInput/InlineInput.ts"
import { CheckboxIcon, checkboxStyles } from "./Checkbox.ts"
import type { CheckboxIcon as CheckboxIconType, CheckboxVariant } from "./Checkbox.ts"
import { checkboxVars } from "./Checkbox.stylex.ts"

export type CheckboxIndicatorPart = "indicator" | "icon"

export type CheckboxIndicatorOptions = {
  readonly size?: InlineInputSize
  readonly radius?: StyleValue
  readonly color?: string
  readonly iconColor?: string
  readonly variant?: CheckboxVariant
  readonly autoContrast?: boolean
}

export type CheckboxIndicatorProps = CheckboxIndicatorOptions &
  StylesApiProps<CheckboxIndicatorPart> & {
    readonly checked?: boolean
    readonly indeterminate?: boolean
    readonly disabled?: boolean
    readonly icon?: CheckboxIconType
  }

export type CheckboxIndicatorConfig = ComponentConfig<CheckboxIndicatorOptions, CheckboxIndicatorPart>

const styles = stylex.create({
  indicator: {
    position: "relative",
    borderWidth: "1px",
    borderStyle: "solid",
    width: checkboxVars.size,
    minWidth: checkboxVars.size,
    height: checkboxVars.size,
    minHeight: checkboxVars.size,
    borderRadius: checkboxVars.radius,
    transitionProperty: "border-color, background-color",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  disabled: { cursor: "not-allowed", borderColor: colors.disabledBorder, backgroundColor: colors.disabled }
})

export const CheckboxIndicator =
  (config: { readonly CheckboxIndicator?: CheckboxIndicatorConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CheckboxIndicatorProps): Html => {
    const props = withDefaults(config.CheckboxIndicator, input)
    const getStyles = stylesApi<M, CheckboxIndicatorPart>(h, props, config.CheckboxIndicator, "indicator")
    const variant = props.variant ?? "filled"
    const checked = props.checked === true
    const indeterminate = props.indeterminate === true
    const disabled = props.disabled === true
    const icon = props.icon ?? CheckboxIcon

    return h.div(
      [
        ...getStyles(
          "indicator",
          ...accentStyle(props.color, customAccent),
          checkboxStyles.sizes[props.size ?? "sm"],
          checkboxStyles.iconColors[variant],
          props.autoContrast === true && variant === "filled" && checkboxStyles.styles.contrast,
          styles.indicator,
          checkboxStyles.variants[variant],
          disabled && styles.disabled,
          setDefinedVars(
            [checkboxVars.radius, radiusValue(props.radius ?? "sm")],
            [checkboxVars.iconColor, mapDefined(props.iconColor, themeColor)]
          )
        ),
        h.DataAttribute("variant", variant),
        ...(checked ? [h.DataAttribute("checked", "")] : []),
        ...(indeterminate ? [h.DataAttribute("indeterminate", "")] : []),
        ...(disabled ? [h.DataAttribute("disabled", "")] : [])
      ],
      [
        h.span(
          getStyles(
            "icon",
            checkboxStyles.styles.icon,
            (checked || indeterminate) && checkboxStyles.styles.iconShown,
            disabled && checkboxStyles.styles.iconDisabled
          ),
          [icon(h, indeterminate)]
        )
      ]
    )
  }

export type CheckboxCardState = { readonly checked: boolean; readonly indeterminate: boolean }

export type CheckboxCardPart = "card"

export type CheckboxCardOptions = { readonly withBorder?: boolean; readonly radius?: StyleValue }

export type CheckboxCardProps<M> = CheckboxCardOptions &
  StylesApiProps<CheckboxCardPart> & {
    readonly checked: boolean
    readonly onChange: (checked: boolean) => M
    readonly indeterminate?: boolean
    readonly disabled?: boolean
    readonly value?: string
    readonly children: ReadonlyArray<Child> | ((state: CheckboxCardState) => ReadonlyArray<Child>)
  }

export type CheckboxCardConfig = ComponentConfig<CheckboxCardOptions, CheckboxCardPart>

const cardStyles = stylex.create({
  card: {
    display: "block",
    width: "100%",
    borderRadius: checkboxVars.radius,
    cursor: "pointer",
    appearance: "none",
    font: "inherit",
    color: "inherit",
    textAlign: "start",
    paddingBlock: 0,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    outline: { default: null, ":focus-visible": `2px solid ${palette.blue6}` },
    outlineOffset: "2px"
  },
  border: { borderWidth: "1px", borderStyle: "solid", borderColor: `light-dark(${palette.gray3}, ${palette.dark4})` },
  disabled: { cursor: "not-allowed" }
})

export const CheckboxCard =
  (config: { readonly CheckboxCard?: CheckboxCardConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CheckboxCardProps<M>): Html => {
    const props = withDefaults(config.CheckboxCard, input)
    const getStyles = stylesApi<M, CheckboxCardPart>(h, props, config.CheckboxCard, "card")
    const withBorder = props.withBorder !== false
    const indeterminate = props.indeterminate === true
    const disabled = props.disabled === true
    const state = { checked: props.checked, indeterminate }

    return h.button(
      [
        ...getStyles(
          "card",
          cardStyles.card,
          withBorder && cardStyles.border,
          disabled && cardStyles.disabled,
          setDefinedVars([checkboxVars.radius, radiusValue(props.radius ?? radius.default)])
        ),
        h.Type("button"),
        h.Role("checkbox"),
        h.AriaChecked(indeterminate ? "mixed" : props.checked),
        ...(withBorder ? [h.DataAttribute("with-border", "")] : []),
        ...(props.checked ? [h.DataAttribute("checked", "")] : []),
        ...(indeterminate ? [h.DataAttribute("indeterminate", "")] : []),
        ...(props.value === undefined ? [] : [h.Value(props.value)]),
        ...(disabled ? [h.Disabled(true)] : [h.OnClick(props.onChange(!props.checked))])
      ],
      typeof props.children === "function" ? props.children(state) : props.children
    )
  }
