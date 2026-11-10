import * as stylex from "@stylexjs/stylex"
import { Effect, Function, MutableRef, Option, Predicate, Schema, Stream } from "effect"
import { childAttributes } from "foldkit/html"
import type { Html, HtmlBuilder } from "foldkit/html"
import * as Mount from "foldkit/mount"
import { listOf, mergeStyles, sx, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, PartStyles } from "../../styles/StylesApi.ts"
import { palette } from "../../theme/palette.stylex.ts"
import { colors } from "../../theme/tokens.stylex.ts"
import type { CloseButtonConfig } from "../CloseButton/CloseButton.ts"
import type { LoaderConfig } from "../Loader/Loader.ts"
import { inputVars } from "./Input.stylex.ts"
import { isAllowedCheck, nextText, refusesInput, valuesOf } from "./numberRules.ts"
import type { AllowedCheck, RefusalRules } from "./numberRules.ts"
import { isShown } from "./Input.ts"
import type { InputConfig, InputSize } from "./Input.ts"
import { inputBase } from "./InputBase.ts"
import type { InputBaseOptions, InputBasePart, InputBaseProps } from "./InputBase.ts"
import type { InputWrapperConfig } from "./InputWrapper.ts"

export type NumberInputValue = number | string

export type NumberInputPart = InputBasePart | "controls" | "control"

export type NumberFormat = {
  readonly allowNegative?: boolean
  readonly allowDecimal?: boolean
  readonly decimalScale?: number
  readonly fixedDecimalScale?: boolean
  readonly decimalSeparator?: string
  readonly thousandSeparator?: string | boolean
  readonly prefix?: string
  readonly suffix?: string
  readonly thousandsGroupStyle?: "thousand" | "lakh" | "wan" | "none"
}

export type NumberInputOptions = InputBaseOptions &
  NumberFormat & {
    readonly clampBehavior?: "strict" | "blur" | "none"
    readonly hideControls?: boolean
    readonly allowLeadingZeros?: boolean
    readonly trimLeadingZeroesOnBlur?: boolean
    readonly selectAllOnFocus?: boolean
    readonly stepHoldDelay?: number
    readonly stepHoldInterval?: number
  }

export type NumberInputProps<M> = NumberInputOptions &
  Omit<
    InputBaseProps<M>,
    "component" | "multiline" | "type" | "pointer" | "styles" | "value" | "onChange" | "onInput" | "onBlur"
  > & {
    readonly styles?: PartStyles<NumberInputPart>
    readonly value: NumberInputValue
    readonly onChange: (value: NumberInputValue) => M
    readonly min?: number
    readonly max?: number
    readonly step?: number
    readonly startValue?: number
    readonly isAllowed?: AllowedCheck
  }

export type NumberInputConfig = ComponentConfig<NumberInputOptions, NumberInputPart>

const sectionWidths: { readonly [Size in InputSize]: string } = {
  xs: "17px",
  sm: "24px",
  md: "27px",
  lg: "31px",
  xl: "34px"
}

const chevronSizes = stylex.create({
  xs: { width: "10px", height: "10px" },
  sm: { width: "14px", height: "14px" },
  md: { width: "16px", height: "16px" },
  lg: { width: "18px", height: "18px" },
  xl: { width: "20px", height: "20px" }
})

const styles = stylex.create({
  controls: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    height: `calc(${inputVars.height} - 2px)`,
    marginInlineStart: "auto"
  },
  control: {
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: "50%",
    width: "100%",
    padding: 0,
    margin: 0,
    borderWidth: 0,
    borderInlineStartWidth: "1px",
    borderInlineStartStyle: "solid",
    borderInlineStartColor: inputVars.bd,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: { default: colors.text, ":disabled": colors.disabledColor },
    backgroundColor: {
      default: "transparent",
      ":hover": `light-dark(${palette.gray0}, ${palette.dark4})`,
      ":disabled": "transparent"
    },
    opacity: { default: 1, ":disabled": 0.6 },
    cursor: { default: "pointer", ":disabled": "not-allowed" }
  },
  first: { borderStartEndRadius: `calc(${inputVars.radius} - 1px)` },
  last: { borderEndEndRadius: `calc(${inputVars.radius} - 1px)` },
  error: { color: colors.error },
  up: { transform: "rotate(180deg)" }
})

const chevronPath =
  "M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"

const separatorOf = (format: NumberFormat): string => {
  if (format.thousandSeparator === true) return ","
  if (Predicate.isString(format.thousandSeparator)) return format.thousandSeparator

  return ""
}

const groupPatterns = {
  thousand: /(\d)(?=(\d{3})+(?!\d))/g,
  lakh: /(\d+?)(?=(\d\d)+(\d)(?!\d))(\.\d+)?/g,
  wan: /(\d)(?=(\d{4})+(?!\d))/g,
  none: /$^/g
}

const grouped = (digits: string, separator: string, style: NumberFormat["thousandsGroupStyle"]): string => {
  if (separator === "") return digits

  return digits.replace(groupPatterns[style ?? "thousand"], `$1${separator}`)
}

const shown = (raw: string, format: NumberFormat): string => {
  const point = raw.indexOf(".")
  const whole = point < 0 ? raw : raw.slice(0, point)
  const sign = whole.startsWith("-") ? "-" : ""
  const integer = grouped(whole.replace("-", ""), separatorOf(format), format.thousandsGroupStyle)
  const decimals = point < 0 ? "" : `${format.decimalSeparator ?? "."}${raw.slice(point + 1)}`

  return `${sign}${format.prefix ?? ""}${integer}${decimals}${format.suffix ?? ""}`
}

export const formatNumber = (value: NumberInputValue, format: NumberFormat): string => {
  if (value === "") return ""
  if (Predicate.isString(value)) return shown(value, format)
  const digits = format.fixedDecimalScale === true ? format.decimalScale : undefined

  return shown(digits === undefined ? String(value) : value.toFixed(digits), format)
}

const complete = /^-?\d+(\.\d+)?$/

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const withoutAffixes = (text: string, format: NumberFormat): string =>
  text
    .replace(new RegExp(`^(-?)${escape(format.prefix ?? "")}`), "$1")
    .replace(new RegExp(`${escape(format.suffix ?? "")}$`), "")
    .split(separatorOf(format) === "" ? "\u0000" : separatorOf(format))
    .join("")

const scaled = (text: string, format: NumberFormat): string => {
  const point = text.indexOf(".")
  if (point < 0 || format.decimalScale === undefined) return text

  return text.slice(0, point + 1 + format.decimalScale)
}

const leadingZeros = /^-?0\d/

export const parseNumber = (text: string, format: NumberFormat, keepLeadingZeros: boolean): NumberInputValue => {
  const plain = withoutAffixes(text, format).replaceAll(format.decimalSeparator ?? ".", ".")
  const signed = format.allowNegative === false ? plain.replaceAll("-", "") : plain
  const cleaned = scaled(signed.replace(/[^\d.-]/g, ""), format)
  if (keepLeadingZeros && leadingZeros.test(cleaned)) return cleaned

  return complete.test(cleaned) ? Number(cleaned) : cleaned
}

const clamp = (value: number, min: number | undefined, max: number | undefined): number =>
  Math.min(Math.max(value, min ?? -Infinity), max ?? Infinity)

const decimalsOf = (step: number) => (String(step).split(".")[1] ?? "").length

export const stepNumber = (
  value: number,
  direction: 1 | -1,
  bounds: { readonly step: number; readonly min?: number | undefined; readonly max?: number | undefined }
): number =>
  clamp(
    Number((value + direction * bounds.step).toFixed(Math.max(decimalsOf(bounds.step), decimalsOf(value)))),
    bounds.min,
    bounds.max
  )

type Configs = {
  readonly Input?: InputConfig
  readonly InputWrapper?: InputWrapperConfig
  readonly Loader?: LoaderConfig
  readonly CloseButton?: CloseButtonConfig
  readonly NumberInput?: NumberInputConfig
}

const isInput = (element: Element): element is HTMLInputElement => element instanceof HTMLInputElement

type FieldRules = RefusalRules & {
  readonly isAllowed: AllowedCheck | undefined
  readonly selectAllOnFocus: boolean
}

const refused = (rules: FieldRules, input: HTMLInputElement, data: string): boolean => {
  const start = Number(input.selectionStart)
  const end = Number(input.selectionEnd)
  if (refusesInput(rules, input.value, start, end, data)) return true
  if (rules.isAllowed === undefined) return false

  return !rules.isAllowed(valuesOf(nextText(input.value, start, end, data), rules.separator))
}

const listen = (rules: FieldRules, input: HTMLInputElement) => {
  const onBeforeInput = (event: InputEvent) => {
    if (!Option.exists(Option.fromNullishOr(event.data), (data) => refused(rules, input, data))) return
    event.preventDefault()
  }
  const onFocus = () => {
    if (!rules.selectAllOnFocus) return
    requestAnimationFrame(() => input.select())
  }
  input.addEventListener("beforeinput", onBeforeInput)
  input.addEventListener("focus", onFocus)

  return () => {
    input.removeEventListener("beforeinput", onBeforeInput)
    input.removeEventListener("focus", onFocus)
  }
}

const FieldRulesMount = Mount.defineStream("NumberInputField", {
  args: {
    allowNegative: Schema.Boolean,
    allowDecimal: Schema.Boolean,
    decimalScale: Schema.Int,
    separator: Schema.String,
    isAllowed: Schema.UndefinedOr(Schema.declare(isAllowedCheck)),
    selectAllOnFocus: Schema.Boolean
  },
  messages: [Schema.Never],
  execute: ({ element, ...rules }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => listen(rules, Option.getOrThrow(Option.liftPredicate(element, isInput)))),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

const isButton = (element: Element): element is HTMLButtonElement => element instanceof HTMLButtonElement

const holdOn = (button: HTMLButtonElement, delay: number, interval: number) => {
  const timers = MutableRef.make<ReadonlyArray<number>>([])
  const stop = () => {
    MutableRef.get(timers).forEach((timer) => window.clearTimeout(timer))
    MutableRef.set(timers, [])
  }
  const repeat = () => {
    button.click()
    MutableRef.set(timers, [window.setTimeout(repeat, interval)])
  }
  const start = () => {
    stop()
    MutableRef.set(timers, [window.setTimeout(repeat, delay)])
  }
  button.addEventListener("pointerdown", start)
  button.addEventListener("pointerleave", stop)
  window.addEventListener("pointerup", stop)
  window.addEventListener("pointercancel", stop)

  return () => {
    stop()
    button.removeEventListener("pointerdown", start)
    button.removeEventListener("pointerleave", stop)
    window.removeEventListener("pointerup", stop)
    window.removeEventListener("pointercancel", stop)
  }
}

const HoldToStep = Mount.defineStream("NumberInputHoldToStep", {
  args: { delay: Schema.Finite, interval: Schema.Finite },
  messages: [Schema.Never],
  execute: ({ element, delay, interval }) =>
    Stream.callback<never>(() =>
      Effect.acquireRelease(
        Effect.sync(() => holdOn(Option.getOrThrow(Option.liftPredicate(element, isButton)), delay, interval)),
        (stop) => Effect.sync(stop)
      ).pipe(Effect.flatMap(() => Effect.never))
    )
})

export type { NumberInputValues } from "./numberRules.ts"

export const NumberInput = (config: Configs) => {
  const base = inputBase("NumberInput")(config)
  const controlParts: ReadonlyArray<"controls" | "control"> = ["controls", "control"]

  return <M>(h: HtmlBuilder<M>, given: NumberInputProps<M>): Html => {
    const props = withDefaults(config.NumberInput, given)
    const size = props.size ?? "sm"
    const step = props.step ?? 1
    const strict = props.clampBehavior === "strict"
    const current = Predicate.isNumber(props.value) ? props.value : (props.startValue ?? 0)
    const stepped = (direction: 1 | -1) =>
      props.onChange(stepNumber(current, direction, { step, min: props.min, max: props.max }))
    const atMax = Predicate.isNumber(props.value) && props.max !== undefined && props.value >= props.max
    const atMin = Predicate.isNumber(props.value) && props.min !== undefined && props.value <= props.min
    const disabled = props.disabled === true
    const holding = Option.all({
      delay: Option.fromNullishOr(props.stepHoldDelay),
      interval: Option.fromNullishOr(props.stepHoldInterval)
    })
    const parts = mergeStyles(controlParts, config.NumberInput?.styles, props.styles)
    const control = (direction: 1 | -1, blocked: boolean, edge: "first" | "last") =>
      h.button(
        [
          ...sx(h, styles.control, styles[edge], isShown(props.error) && styles.error, ...listOf(parts.control)),
          h.Type("button"),
          h.Tabindex(-1),
          h.AriaHidden(true),
          h.Disabled(disabled || blocked),
          h.DataAttribute("direction", direction === 1 ? "up" : "down"),
          h.OnClick(stepped(direction)),
          ...Option.match(holding, {
            onNone: () => [],
            onSome: (hold) => [h.OnMount(Mount.mapMessage(HoldToStep(hold), Function.absurd<M>))]
          })
        ],
        [
          h.svg(
            [
              ...sx(h, chevronSizes[size], direction === 1 && styles.up),
              h.Attribute("viewBox", "0 0 15 15"),
              h.Attribute("fill", "none")
            ],
            [
              h.path(
                [
                  h.Attribute("d", chevronPath),
                  h.Attribute("fill", "currentColor"),
                  h.Attribute("fill-rule", "evenodd"),
                  h.Attribute("clip-rule", "evenodd")
                ],
                []
              )
            ]
          )
        ]
      )
    const controls = h.div(sx(h, styles.controls, ...listOf(parts.controls)), [
      control(1, atMax, "first"),
      control(-1, atMin, "last")
    ])
    const onInput = (text: string) => {
      const parsed = parseNumber(text, props, props.allowLeadingZeros !== false)

      return props.onChange(strict && Predicate.isNumber(parsed) ? clamp(parsed, props.min, props.max) : parsed)
    }
    const committed = (text: string) => {
      const parsed = parseNumber(
        text.replace(new RegExp(`${escape(props.decimalSeparator ?? ".")}$`), ""),
        props,
        props.trimLeadingZeroesOnBlur === false
      )

      return props.onChange(Predicate.isNumber(parsed) ? clamp(parsed, props.min, props.max) : parsed)
    }
    const keys = (key: string): Option.Option<M> => {
      if (key === "ArrowUp") return Option.some(stepped(1))
      if (key === "ArrowDown") return Option.some(stepped(-1))

      return Option.none()
    }
    const withControls = props.hideControls !== true && props.rightSection === undefined
    const display = formatNumber(props.value, props)
    const refusal = Mount.mapMessage(
      FieldRulesMount({
        allowNegative: props.allowNegative !== false,
        allowDecimal: props.allowDecimal !== false,
        decimalScale: props.decimalScale ?? -1,
        separator: props.decimalSeparator ?? ".",
        isAllowed: props.isAllowed,
        selectAllOnFocus: props.selectAllOnFocus === true
      }),
      Function.absurd<M>
    )

    return base(h, {
      ...props,
      type: "text",
      inputMode: "decimal",
      value: display,
      fieldBind: childAttributes([h.OnMount(refusal)]),
      onInput,
      ...(props.clampBehavior === "none" ? {} : { onChange: committed }),
      onKeyDown: keys,
      ...(withControls
        ? { rightSection: controls, rightSectionWidth: sectionWidths[size], rightSectionPointerEvents: "all" as const }
        : {})
    })
  }
}
