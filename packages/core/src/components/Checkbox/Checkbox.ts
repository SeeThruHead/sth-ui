import * as stylex from "@stylexjs/stylex"
import * as FoldkitCheckbox from "@foldkit/ui/checkbox"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle, themeColor } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors } from "../../theme/tokens.stylex.ts"
import { descriptionIdOf, errorIdOf, hasMessage, inlineInput, inlineInputSizes } from "../InlineInput/InlineInput.ts"
import type { InlineInputPart, InlineInputSize, LabelPosition } from "../InlineInput/InlineInput.ts"
import { isShown } from "../Input/Input.ts"
import { checkboxVars } from "./Checkbox.stylex.ts"

export type CheckboxPart = InlineInputPart | "inner" | "input" | "icon"

export type CheckboxVariant = "filled" | "outline" | "light"

export type CheckboxIcon = <N>(h: HtmlBuilder<N>, indeterminate: boolean) => Html

export type CheckboxOptions = {
  readonly size?: InlineInputSize
  readonly radius?: StyleValue
  readonly color?: string
  readonly iconColor?: string
  readonly variant?: CheckboxVariant
  readonly labelPosition?: LabelPosition
  readonly withErrorStyles?: boolean
  readonly autoContrast?: boolean
}

export type CheckboxProps<M> = CheckboxOptions &
  StylesApiProps<CheckboxPart> & {
    readonly id: string
    readonly label?: Child
    readonly description?: Child
    readonly error?: boolean | Child
    readonly checked?: boolean
    readonly indeterminate?: boolean
    readonly disabled?: boolean
    readonly readOnly?: boolean
    readonly onChange: (checked: boolean) => M
    readonly name?: string
    readonly value?: string
    readonly icon?: CheckboxIcon
  }

export type CheckboxConfig = ComponentConfig<CheckboxOptions, CheckboxPart>

const sizes = stylex.create({
  xs: { [checkboxVars.size]: "16px" },
  sm: { [checkboxVars.size]: "20px" },
  md: { [checkboxVars.size]: "24px" },
  lg: { [checkboxVars.size]: "30px" },
  xl: { [checkboxVars.size]: "36px" }
})

const on = ":is([data-checked], [data-indeterminate])"

const variants = stylex.create({
  filled: {
    backgroundColor: { default: `light-dark(${palette.white}, ${palette.dark6})`, [on]: accent.filled },
    borderColor: { default: `light-dark(${palette.gray4}, ${palette.dark4})`, [on]: accent.filled }
  },
  outline: {
    backgroundColor: { default: `light-dark(${palette.white}, ${palette.dark6})`, [on]: "transparent" },
    borderColor: { default: `light-dark(${palette.gray4}, ${palette.dark4})`, [on]: accent.outline }
  },
  light: {
    backgroundColor: { default: `light-dark(${palette.white}, ${palette.dark6})`, [on]: accent.light },
    borderColor: { default: `light-dark(${palette.gray4}, ${palette.dark4})`, [on]: "transparent" }
  }
})

const iconColors = stylex.create({
  filled: { [checkboxVars.iconColor]: palette.white },
  outline: { [checkboxVars.iconColor]: accent.outline },
  light: { [checkboxVars.iconColor]: accent.lightColor }
})

const styles = stylex.create({
  inner: { position: "relative", width: checkboxVars.size, height: checkboxVars.size, flexShrink: 0 },
  innerLeft: { order: 2 },
  innerRight: { order: 1 },
  input: {
    appearance: "none",
    borderWidth: "1px",
    borderStyle: "solid",
    width: checkboxVars.size,
    height: checkboxVars.size,
    borderRadius: checkboxVars.radius,
    padding: 0,
    display: "block",
    margin: 0,
    transitionProperty: "border-color, background-color",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px"
  },
  error: { borderColor: colors.error },
  disabled: { cursor: "not-allowed", borderColor: colors.disabledBorder, backgroundColor: colors.disabled },
  readOnly: { cursor: "default" },
  icon: {
    position: "absolute",
    inset: 0,
    width: "60%",
    margin: "auto",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    color: checkboxVars.iconColor,
    pointerEvents: "none",
    transform: "translateY(5px) scale(0.5)",
    opacity: 0,
    transitionProperty: "transform, opacity",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease"
  },
  iconShown: { transform: "none", opacity: 1 },
  iconDisabled: { color: colors.disabledColor },
  contrast: { [checkboxVars.iconColor]: accent.contrast }
})

export const checkboxStyles = { sizes, variants, iconColors, styles }

const checkPath =
  "M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z"

export const CheckboxIcon: CheckboxIcon = (h, indeterminate) =>
  indeterminate
    ? h.svg(
        [h.Attribute("viewBox", "0 0 32 6"), h.Attribute("fill", "none"), h.AriaHidden(true)],
        [
          h.rect(
            [
              h.Attribute("width", "32"),
              h.Attribute("height", "6"),
              h.Attribute("rx", "3"),
              h.Attribute("fill", "currentColor")
            ],
            []
          )
        ]
      )
    : h.svg(
        [h.Attribute("viewBox", "0 0 10 7"), h.Attribute("fill", "none"), h.AriaHidden(true)],
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

const describedBy = (props: { readonly id: string; readonly description?: Child; readonly error?: boolean | Child }) =>
  [
    ...(props.description === undefined ? [] : [descriptionIdOf(props.id)]),
    ...(hasMessage(props.error) ? [errorIdOf(props.id)] : [])
  ].join(" ")

export const Checkbox =
  (config: { readonly Checkbox?: CheckboxConfig }) =>
  <M>(h: HtmlBuilder<M>, input: CheckboxProps<M>): Html => {
    const props = withDefaults(config.Checkbox, input)
    const { id: _id, ...rootProps } = props
    const getStyles = stylesApi<M, CheckboxPart>(h, rootProps, config.Checkbox, "root")
    const size = props.size ?? "sm"
    const variant = props.variant ?? "filled"
    const labelPosition = props.labelPosition ?? "right"
    const checked = props.checked === true
    const indeterminate = props.indeterminate === true
    const disabled = props.disabled === true
    const error = isShown(props.error) && props.withErrorStyles !== false
    const shown = checked || indeterminate
    const description = describedBy(props)
    const icon = props.icon ?? CheckboxIcon

    return FoldkitCheckbox.view(
      {
        id: props.id,
        isChecked: checked,
        onToggle: props.onChange,
        isDisabled: disabled,
        isReadOnly: props.readOnly === true,
        isIndeterminate: indeterminate,
        ...(props.name === undefined ? {} : { name: props.name }),
        ...(props.value === undefined ? {} : { value: props.value }),
        toView: (attributes) =>
          inlineInput(h, getStyles, {
            id: props.id,
            size,
            labelPosition,
            ...(props.label === undefined ? {} : { label: props.label }),
            ...(props.description === undefined ? {} : { description: props.description }),
            ...(props.error === undefined ? {} : { error: props.error }),
            disabled,
            rootAttributes: [
              ...getStyles(
                "root",
                inlineInputSizes[size],
                ...accentStyle(props.color, customAccent),
                sizes[size],
                iconColors[variant],
                props.autoContrast === true && variant === "filled" && styles.contrast,
                setDefinedVars(
                  [checkboxVars.radius, radiusValue(props.radius ?? "sm")],
                  [checkboxVars.iconColor, mapDefined(props.iconColor, themeColor)]
                )
              ),
              h.DataAttribute("variant", variant),
              ...(checked ? [h.DataAttribute("checked", "")] : [])
            ],
            labelAttributes: attributes.label,
            control: h.div(
              [
                ...getStyles("inner", styles.inner, labelPosition === "left" ? styles.innerLeft : styles.innerRight),
                h.DataAttribute("label-position", labelPosition)
              ],
              [
                h.button(
                  [
                    ...attributes.checkbox,
                    ...getStyles(
                      "input",
                      styles.input,
                      variants[variant],
                      error && styles.error,
                      disabled && styles.disabled,
                      props.readOnly === true && styles.readOnly
                    ),
                    h.Id(props.id),
                    ...(description === "" ? [] : [h.AriaDescribedBy(description)]),
                    ...(isShown(props.error) ? [h.AriaInvalid(true)] : []),
                    ...(error ? [h.DataAttribute("error", "")] : []),
                    ...(indeterminate ? [h.DataAttribute("indeterminate", "")] : [])
                  ],
                  []
                ),
                h.span(getStyles("icon", styles.icon, shown && styles.iconShown, disabled && styles.iconDisabled), [
                  icon(h, indeterminate)
                ]),
                ...(props.name === undefined ? [] : [h.input(attributes.hiddenInput)])
              ]
            )
          })
      },
      h
    )
  }
