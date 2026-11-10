import * as stylex from "@stylexjs/stylex"
import { Effect, Function, Option, Schema, Stream } from "effect"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import type { Child } from "../../content.ts"
import { radiusValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle, themeColor } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { accent, colors, radius } from "../../theme/tokens.stylex.ts"
import type { InlineInputSize } from "../InlineInput/InlineInput.ts"
import { RadioIcon, radioStyles } from "./Radio.ts"
import type { RadioIcon as RadioIconType, RadioVariant } from "./Radio.ts"
import { radioVars } from "./Radio.stylex.ts"

export type RadioIndicatorPart = "indicator" | "icon"

export type RadioIndicatorOptions = {
  readonly size?: InlineInputSize
  readonly radius?: StyleValue
  readonly color?: string
  readonly iconColor?: string
  readonly variant?: RadioVariant
  readonly autoContrast?: boolean
}

export type RadioIndicatorProps = RadioIndicatorOptions &
  StylesApiProps<RadioIndicatorPart> & {
    readonly checked?: boolean
    readonly disabled?: boolean
    readonly icon?: RadioIconType
  }

export type RadioIndicatorConfig = ComponentConfig<RadioIndicatorOptions, RadioIndicatorPart>

const on = ":is([data-checked])"

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

const styles = stylex.create({
  indicator: {
    position: "relative",
    borderWidth: "1px",
    borderStyle: "solid",
    width: radioVars.size,
    minWidth: radioVars.size,
    height: radioVars.size,
    minHeight: radioVars.size,
    borderRadius: radioVars.radius,
    transitionProperty: "border-color, background-color",
    transitionDuration: "100ms",
    transitionTimingFunction: "ease",
    WebkitTapHighlightColor: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  disabled: { cursor: "not-allowed", backgroundColor: colors.disabled, borderColor: colors.disabledBorder }
})

export const RadioIndicator =
  (config: { readonly RadioIndicator?: RadioIndicatorConfig }) =>
  <M>(h: HtmlBuilder<M>, input: RadioIndicatorProps): Html => {
    const props = withDefaults(config.RadioIndicator, input)
    const getStyles = stylesApi<M, RadioIndicatorPart>(h, props, config.RadioIndicator, "indicator")
    const variant = props.variant ?? "filled"
    const checked = props.checked === true
    const disabled = props.disabled === true
    const icon = props.icon ?? RadioIcon

    return h.div(
      [
        ...getStyles(
          "indicator",
          ...accentStyle(props.color, customAccent),
          radioStyles.sizes[props.size ?? "sm"],
          radioStyles.iconColors[variant],
          props.autoContrast === true && variant === "filled" && radioStyles.styles.contrast,
          styles.indicator,
          variants[variant],
          disabled && styles.disabled,
          setDefinedVars(
            [radioVars.radius, mapDefined(props.radius, radiusValue)],
            [radioVars.iconColor, mapDefined(props.iconColor, themeColor)]
          )
        ),
        h.DataAttribute("variant", variant),
        ...(checked ? [h.DataAttribute("checked", "")] : []),
        ...(disabled ? [h.DataAttribute("disabled", "")] : [])
      ],
      [
        h.span(
          getStyles(
            "icon",
            radioStyles.styles.icon,
            checked && radioStyles.styles.iconShown,
            disabled && radioStyles.styles.iconDisabled
          ),
          [icon(h)]
        )
      ]
    )
  }

export type RadioCardState = { readonly checked: boolean }

export type RadioCardPart = "card"

export type RadioCardOptions = { readonly withBorder?: boolean; readonly radius?: StyleValue }

export type RadioCardProps<M> = RadioCardOptions &
  StylesApiProps<RadioCardPart> & {
    readonly checked: boolean
    readonly onChange: M
    readonly name?: string
    readonly value?: string
    readonly disabled?: boolean
    readonly dir?: "ltr" | "rtl"
    readonly children: ReadonlyArray<Child> | ((state: RadioCardState) => ReadonlyArray<Child>)
  }

export type RadioCardConfig = ComponentConfig<RadioCardOptions, RadioCardPart>

const cardStyles = stylex.create({
  card: {
    display: "block",
    width: "100%",
    borderRadius: radioVars.radius,
    cursor: "pointer",
    appearance: "none",
    font: "inherit",
    color: "inherit",
    textAlign: "start",
    paddingBlock: 0,
    paddingInline: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    outline: { default: null, ":focus-visible": `2px solid ${accent.filled}` },
    outlineOffset: "2px"
  },
  border: { borderWidth: "1px", borderStyle: "solid", borderColor: `light-dark(${palette.gray3}, ${palette.dark4})` },
  disabled: { cursor: "not-allowed" }
})

const steps: ReadonlyMap<string, number> = new Map([
  ["ArrowDown", 1],
  ["ArrowUp", -1],
  ["ArrowRight", 1],
  ["ArrowLeft", -1]
])

const isHorizontal = (key: string): boolean => key === "ArrowLeft" || key === "ArrowRight"

const moveFrom = (card: HTMLElement, name: string, rtl: boolean) => (event: KeyboardEvent) =>
  Option.map(Option.fromNullishOr(steps.get(event.key)), (step) => {
    event.preventDefault()
    const siblings = Array.from(document.querySelectorAll<HTMLElement>(`[role="radio"][name="${CSS.escape(name)}"]`))
    const index = siblings.indexOf(card)
    const direction = rtl && isHorizontal(event.key) ? -step : step
    const target = siblings.at((index + direction) % siblings.length)
    target?.focus()
    target?.click()
  })

const isElement = (element: Element): element is HTMLElement => element instanceof HTMLElement

const RadioCardKeys = Mount.defineStream("RadioCardKeys", {
  args: { name: Schema.String, rtl: Schema.Boolean },
  messages: [Schema.Never],
  execute: ({ element, name, rtl }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => {
          const card = Option.getOrThrow(Option.liftPredicate(element, isElement))
          const listener = moveFrom(card, name, rtl)
          card.addEventListener("keydown", listener)

          return () => card.removeEventListener("keydown", listener)
        }),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export const RadioCard =
  (config: { readonly RadioCard?: RadioCardConfig }) =>
  <M>(h: HtmlBuilder<M>, input: RadioCardProps<M>): Html => {
    const props = withDefaults(config.RadioCard, input)
    const getStyles = stylesApi<M, RadioCardPart>(h, props, config.RadioCard, "card")
    const withBorder = props.withBorder !== false
    const disabled = props.disabled === true

    return h.button(
      [
        ...getStyles(
          "card",
          cardStyles.card,
          withBorder && cardStyles.border,
          disabled && cardStyles.disabled,
          setDefinedVars([radioVars.radius, radiusValue(props.radius ?? radius.default)])
        ),
        h.Type("button"),
        h.Role("radio"),
        h.AriaChecked(props.checked),
        ...(withBorder ? [h.DataAttribute("with-border", "")] : []),
        ...(props.checked ? [h.DataAttribute("checked", "")] : []),
        ...(props.value === undefined ? [] : [h.Value(props.value)]),
        ...(props.name === undefined
          ? []
          : [
              h.Name(props.name),
              ...childAttributes([
                h.OnMount(
                  Mount.mapMessage(RadioCardKeys({ name: props.name, rtl: props.dir === "rtl" }), Function.absurd<M>)
                )
              ])
            ]),
        ...(disabled ? [h.Disabled(true)] : [h.OnClick(props.onChange)])
      ],
      typeof props.children === "function" ? props.children({ checked: props.checked }) : props.children
    )
  }
