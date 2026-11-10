import * as stylex from "@stylexjs/stylex"
import type { Attribute, ChildAttribute, Html, HtmlBuilder } from "foldkit/html"
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
import { radioVars } from "./Radio.stylex.ts"

export type RadioPart = InlineInputPart | "inner" | "radio" | "icon"

export type RadioVariant = "filled" | "outline" | "light"

export type RadioIcon = <N>(h: HtmlBuilder<N>) => Html

export type RadioOptions = {
  readonly size?: InlineInputSize
  readonly radius?: StyleValue
  readonly color?: string
  readonly iconColor?: string
  readonly variant?: RadioVariant
  readonly labelPosition?: LabelPosition
  readonly withErrorStyles?: boolean
  readonly autoContrast?: boolean
}

export type RadioLook = RadioOptions &
  StylesApiProps<RadioPart> & {
    readonly label?: Child
    readonly description?: Child
    readonly error?: boolean | Child
    readonly disabled?: boolean
    readonly icon?: RadioIcon
  }

export type RadioProps<M> = RadioLook & {
  readonly id: string
  readonly checked?: boolean
  readonly onChange: (checked: boolean) => M
  readonly name?: string
  readonly value?: string
}

export type RadioConfig = ComponentConfig<RadioOptions, RadioPart>

const sizes = stylex.create({
  xs: { [radioVars.size]: "16px", [radioVars.iconSize]: "6px" },
  sm: { [radioVars.size]: "20px", [radioVars.iconSize]: "8px" },
  md: { [radioVars.size]: "24px", [radioVars.iconSize]: "10px" },
  lg: { [radioVars.size]: "30px", [radioVars.iconSize]: "14px" },
  xl: { [radioVars.size]: "36px", [radioVars.iconSize]: "16px" }
})

const on = ":is([aria-checked='true'])"

const resting = {
  backgroundColor: `light-dark(${palette.white}, ${palette.dark6})`,
  borderColor: `light-dark(${palette.gray4}, ${palette.dark4})`
}

const variants = stylex.create({
  filled: {
    backgroundColor: { default: resting.backgroundColor, [on]: accent.filled },
    borderColor: { default: resting.borderColor, [on]: accent.filled }
  },
  outline: {
    backgroundColor: { default: resting.backgroundColor, [on]: "transparent" },
    borderColor: { default: resting.borderColor, [on]: accent.outline }
  },
  light: {
    backgroundColor: { default: resting.backgroundColor, [on]: accent.light },
    borderColor: { default: resting.borderColor, [on]: "transparent" }
  }
})

const iconColors = stylex.create({
  filled: { [radioVars.iconColor]: palette.white },
  outline: { [radioVars.iconColor]: accent.outline },
  light: { [radioVars.iconColor]: accent.lightColor }
})

const styles = stylex.create({
  inner: { position: "relative", width: radioVars.size, height: radioVars.size, flexShrink: 0 },
  innerLeft: { order: 2 },
  innerRight: { order: 1 },
  radio: {
    borderWidth: "1px",
    borderStyle: "solid",
    position: "relative",
    appearance: "none",
    width: radioVars.size,
    height: radioVars.size,
    borderRadius: radioVars.radius,
    margin: 0,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transitionProperty: "background-color, border-color",
    transitionTimingFunction: "ease",
    transitionDuration: "100ms",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px"
  },
  error: { borderColor: colors.error },
  disabled: { cursor: "not-allowed", backgroundColor: colors.disabled, borderColor: colors.disabledBorder },
  icon: {
    color: radioVars.iconColor,
    opacity: 0,
    translate: "-50% -50%",
    transform: "scale(0.2) translateY(10px)",
    transitionProperty: "opacity, transform",
    transitionDuration: "100ms, 200ms",
    transitionTimingFunction: "ease",
    pointerEvents: "none",
    width: radioVars.iconSize,
    height: radioVars.iconSize,
    position: "absolute",
    top: "50%",
    left: "50%",
    display: "flex"
  },
  iconShown: { opacity: 1, transform: "scale(1)" },
  iconDisabled: { color: colors.disabledColor },
  contrast: { [radioVars.iconColor]: accent.contrast }
})

export const radioStyles = { sizes, iconColors, styles }

const innerOrder = { left: styles.innerLeft, right: styles.innerRight }

export const RadioIcon: RadioIcon = (h) =>
  h.svg(
    [h.Attribute("viewBox", "0 0 5 5"), h.Attribute("fill", "none"), h.AriaHidden(true)],
    [
      h.circle(
        [
          h.Attribute("cx", "2.5"),
          h.Attribute("cy", "2.5"),
          h.Attribute("r", "2.5"),
          h.Attribute("fill", "currentColor")
        ],
        []
      )
    ]
  )

export type RadioWiring<M> = {
  readonly id: string
  readonly checked: boolean
  readonly control: ReadonlyArray<Attribute<M> | ChildAttribute>
  readonly labelAttributes: ReadonlyArray<Attribute<M> | ChildAttribute>
  readonly extra?: ReadonlyArray<Html>
}

export const radioView = <M>(
  h: HtmlBuilder<M>,
  config: RadioConfig | undefined,
  look: RadioLook,
  wiring: RadioWiring<M>
) => {
  const props = withDefaults(config, look)
  const getStyles = stylesApi<M, RadioPart>(h, props, config, "root")
  const size = props.size ?? "sm"
  const variant = props.variant ?? "filled"
  const labelPosition = props.labelPosition ?? "right"
  const disabled = props.disabled === true
  const error = isShown(props.error) && props.withErrorStyles !== false
  const description = [
    ...(props.description === undefined ? [] : [descriptionIdOf(wiring.id)]),
    ...(hasMessage(props.error) ? [errorIdOf(wiring.id)] : [])
  ].join(" ")
  const icon = props.icon ?? RadioIcon

  return inlineInput(h, getStyles, {
    id: wiring.id,
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
          [radioVars.radius, mapDefined(props.radius, radiusValue)],
          [radioVars.iconColor, mapDefined(props.iconColor, themeColor)]
        )
      ),
      h.DataAttribute("variant", variant),
      ...(wiring.checked ? [h.DataAttribute("checked", "")] : [])
    ],
    labelAttributes: wiring.labelAttributes,
    control: h.div(
      [
        ...getStyles("inner", styles.inner, innerOrder[labelPosition]),
        h.DataAttribute("label-position", labelPosition)
      ],
      [
        h.button(
          [
            ...wiring.control,
            ...getStyles("radio", styles.radio, variants[variant], error && styles.error, disabled && styles.disabled),
            ...(description === "" ? [] : [h.AriaDescribedBy(description)]),
            ...(isShown(props.error) ? [h.AriaInvalid(true)] : []),
            ...(error ? [h.DataAttribute("error", "")] : [])
          ],
          []
        ),
        h.span(getStyles("icon", styles.icon, wiring.checked && styles.iconShown, disabled && styles.iconDisabled), [
          icon(h)
        ]),
        ...(wiring.extra ?? [])
      ]
    )
  })
}

export const Radio =
  (config: { readonly Radio?: RadioConfig }) =>
  <M>(h: HtmlBuilder<M>, props: RadioProps<M>): Html => {
    const { id: _id, onChange: _onChange, ...look } = props
    const checked = props.checked === true
    const disabled = props.disabled === true

    return radioView(h, config.Radio, look, {
      id: props.id,
      checked,
      labelAttributes: [h.For(props.id), h.Id(`${props.id}-label`)],
      control: [
        h.Type("button"),
        h.Role("radio"),
        h.Id(props.id),
        h.AriaChecked(checked),
        ...(props.label === undefined ? [] : [h.AriaLabelledBy(`${props.id}-label`)]),
        ...(disabled ? [h.AriaDisabled(true), h.DataAttribute("disabled", "")] : [h.OnClick(props.onChange(true))]),
        ...(checked ? [h.DataAttribute("checked", "")] : [])
      ],
      extra:
        props.name === undefined
          ? []
          : [h.input([h.Type("hidden"), h.Name(props.name), h.Value(checked ? (props.value ?? "on") : "")])]
    })
  }
