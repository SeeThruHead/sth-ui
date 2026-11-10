import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { rollingVars } from "./RollingNumber.stylex.ts"

export type RollingNumberPart = "root" | "copyValue" | "digit" | "digitColumn" | "char"

export type RollingNumberOptions = {
  readonly animationDuration?: number
  readonly timingFunction?: string
  readonly decimalSeparator?: string
  readonly thousandSeparator?: string | boolean
  readonly decimalScale?: number
  readonly fixedDecimalScale?: boolean
  readonly tabularNumbers?: boolean
  readonly withLiveRegion?: boolean
}

export type RollingNumberProps = RollingNumberOptions &
  StylesApiProps<RollingNumberPart> & {
    readonly value: number
    readonly previousValue?: number
    readonly prefix?: string
    readonly suffix?: string
  }

export type RollingNumberConfig = ComponentConfig<RollingNumberOptions, RollingNumberPart>

type DigitParts = {
  readonly negative: boolean
  readonly intDigits: ReadonlyArray<string>
  readonly fracDigits: ReadonlyArray<string>
  readonly hasDecimal: boolean
}

type Slot =
  | {
      readonly type: "digit"
      readonly key: string
      readonly digit: string
      readonly previous: string | null
      readonly empty: boolean
    }
  | { readonly type: "char"; readonly key: string; readonly char: string; readonly empty: boolean }

const plain = (value: number, decimalScale: number | undefined) => {
  if (!Number.isFinite(value)) return "0"
  if (decimalScale !== undefined)
    return new Intl.NumberFormat("en-US", {
      useGrouping: false,
      minimumFractionDigits: decimalScale,
      maximumFractionDigits: decimalScale
    }).format(value)

  return new Intl.NumberFormat("en-US", { useGrouping: false, maximumFractionDigits: 20 }).format(value)
}

const splitAtDot = (text: string): readonly [string, string] => {
  const dot = text.indexOf(".")

  return dot < 0 ? [text, ""] : [text.slice(0, dot), text.slice(dot + 1)]
}

const trimmed = (text: string, trim: boolean) => {
  if (!trim) return text
  const [whole, fraction] = splitAtDot(text)
  const kept = fraction.replace(/0+$/, "")

  return kept === "" ? whole : `${whole}.${kept}`
}

const partsOf = (value: number, options: RollingNumberOptions): DigitParts => {
  const text = trimmed(
    plain(Math.abs(value), options.decimalScale),
    options.fixedDecimalScale !== true && options.decimalScale !== undefined
  )
  const [whole, fraction] = splitAtDot(text)

  return {
    negative: value < 0 && /[1-9]/.test(text),
    intDigits: whole.split(""),
    fracDigits: fraction === "" ? [] : fraction.split(""),
    hasDecimal: text.includes(".")
  }
}

const padStart = (digits: ReadonlyArray<string>, length: number): ReadonlyArray<string | null> => [
  ...Array.from({ length: length - digits.length }, () => null),
  ...digits
]

const padEnd = (digits: ReadonlyArray<string>, length: number): ReadonlyArray<string | null> => [
  ...digits,
  ...Array.from({ length: length - digits.length }, () => null)
]

const separatorOf = (separator: string | boolean | undefined) => {
  if (separator === undefined || separator === false) return null

  return Predicate.isString(separator) ? separator : ","
}

const charSlots = (text: string | undefined, name: string): ReadonlyArray<Slot> =>
  (text ?? "").split("").map((char, index) => ({ type: "char", key: `${name}-${index}`, char, empty: false }))

const slotsOf = (current: DigitParts, previous: DigitParts, props: RollingNumberProps): ReadonlyArray<Slot> => {
  const intLength = Math.max(current.intDigits.length, previous.intDigits.length)
  const fracLength = Math.max(current.fracDigits.length, previous.fracDigits.length)
  const currentInt = padStart(current.intDigits, intLength)
  const previousInt = padStart(previous.intDigits, intLength)
  const currentFrac = padEnd(current.fracDigits, fracLength)
  const previousFrac = padEnd(previous.fracDigits, fracLength)
  const separator = separatorOf(props.thousandSeparator)
  const intSlots = currentInt.flatMap((digit, index): ReadonlyArray<Slot> => {
    const fromRight = intLength - 1 - index
    const slot: Slot = {
      type: "digit",
      key: `int-${fromRight}`,
      digit: digit ?? "0",
      previous: previousInt[index] ?? null,
      empty: digit === null
    }

    return separator !== null && fromRight > 0 && fromRight % 3 === 0
      ? [slot, { type: "char", key: `sep-${fromRight}`, char: separator, empty: digit === null }]
      : [slot]
  })
  const fracSlots = currentFrac.map((digit, index): Slot => ({
    type: "digit",
    key: `frac-${index}`,
    digit: digit ?? "0",
    previous: previousFrac[index] ?? null,
    empty: digit === null
  }))

  return [
    ...charSlots(props.prefix, "prefix"),
    ...(current.negative || previous.negative
      ? [{ type: "char" as const, key: "sign", char: "-", empty: !current.negative }]
      : []),
    ...intSlots,
    ...(current.hasDecimal || previous.hasDecimal
      ? [{ type: "char" as const, key: "dec", char: props.decimalSeparator ?? ".", empty: !current.hasDecimal }]
      : []),
    ...fracSlots,
    ...charSlots(props.suffix, "suffix")
  ]
}

const valueText = (parts: DigitParts, props: RollingNumberProps) => {
  const separator = separatorOf(props.thousandSeparator)
  const whole = parts.intDigits.join("")
  const grouped = separator === null ? whole : whole.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
  const fraction = parts.fracDigits.length > 0 ? `${props.decimalSeparator ?? "."}${parts.fracDigits.join("")}` : ""

  return `${props.prefix ?? ""}${parts.negative ? "-" : ""}${grouped}${fraction}${props.suffix ?? ""}`
}

const strip = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "1"]

const roll = stylex.keyframes({
  from: { transform: rollingVars.rollFrom },
  to: { transform: rollingVars.rollTo }
})

const styles = stylex.create({
  root: {
    [rollingVars.duration]: "600ms",
    position: "relative",
    display: "inline-flex",
    alignItems: "baseline",
    overflow: "hidden"
  },
  tabular: { fontVariantNumeric: "tabular-nums" },
  copyValue: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 1,
    overflow: "hidden",
    whiteSpace: "pre",
    color: "transparent",
    forcedColorAdjust: "none"
  },
  digit: {
    position: "relative",
    zIndex: 2,
    display: "inline-block",
    width: "1ch",
    height: "1em",
    overflow: "hidden",
    lineHeight: 1,
    pointerEvents: "none",
    userSelect: "none",
    transitionProperty: "width, opacity",
    transitionDuration: rollingVars.duration,
    transitionTimingFunction: rollingVars.timingFunction
  },
  empty: { width: 0, opacity: 0 },
  column: {
    position: "relative",
    top: rollingVars.top,
    display: "flex",
    flexDirection: "column",
    animationName: roll,
    animationDuration: rollingVars.duration,
    animationTimingFunction: rollingVars.timingFunction
  },
  cell: { display: "flex", alignItems: "center", justifyContent: "center", height: "1em" },
  char: {
    position: "relative",
    zIndex: 2,
    display: "inline-block",
    overflow: "hidden",
    whiteSpace: "pre",
    pointerEvents: "none",
    userSelect: "none",
    transitionProperty: "opacity",
    transitionDuration: rollingVars.duration,
    transitionTimingFunction: rollingVars.timingFunction
  }
})

export const RollingNumber =
  (config: { readonly RollingNumber?: RollingNumberConfig }) =>
  <M>(h: HtmlBuilder<M>, input: RollingNumberProps): Html => {
    const props = withDefaults(config.RollingNumber, input)
    const getStyles = stylesApi<M, RollingNumberPart>(h, props, config.RollingNumber, "root")
    const previousValue = props.previousValue ?? props.value
    const up = props.value >= previousValue
    const current = partsOf(props.value, props)
    const label = valueText(current, props)
    const digitView = (slot: Extract<Slot, { readonly type: "digit" }>) => {
      const index = Number(slot.digit)
      const previousIndex = slot.previous === null ? index : Number(slot.previous)
      const wraps = up && slot.previous !== null && index < previousIndex && index <= 1
      const target = wraps ? index + 10 : index

      return h.keyed("span")(
        slot.key,
        [
          ...getStyles("digit", styles.digit, slot.empty && styles.empty),
          ...(slot.empty ? [h.DataAttribute("empty", "")] : []),
          h.AriaHidden(true)
        ],
        [
          h.keyed("span")(
            `${slot.key}-${slot.digit}`,
            [
              ...getStyles(
                "digitColumn",
                styles.column,
                setVars(
                  [rollingVars.rollFrom, `translateY(${index - previousIndex}em)`],
                  [rollingVars.rollTo, `translateY(${index - target}em)`],
                  [rollingVars.top, `${-index}em`]
                )
              ),
              h.DataAttribute("direction", index >= previousIndex ? "up" : "down")
            ],
            strip.map((cell) => h.span(getStyles("digitColumn", styles.cell), [cell]))
          )
        ]
      )
    }

    return h.span(
      [
        ...getStyles(
          "root",
          styles.root,
          props.tabularNumbers !== false && styles.tabular,
          setVars(
            [rollingVars.duration, `${props.animationDuration ?? 600}ms`],
            [rollingVars.timingFunction, props.timingFunction ?? "ease"]
          )
        ),
        h.Role(props.withLiveRegion === true ? "status" : "img"),
        h.AriaLabel(label),
        ...(props.tabularNumbers === false ? [] : [h.DataAttribute("tabular-numbers", "")])
      ],
      [
        h.span([...getStyles("copyValue", styles.copyValue), h.AriaHidden(true)], [label]),
        ...slotsOf(current, partsOf(previousValue, props), props).map((slot) =>
          slot.type === "digit"
            ? digitView(slot)
            : h.keyed("span")(
                slot.key,
                [
                  ...getStyles("char", styles.char, slot.empty && styles.empty),
                  ...(slot.empty ? [h.DataAttribute("empty", "")] : []),
                  h.AriaHidden(true)
                ],
                [slot.char]
              )
        )
      ]
    )
  }
