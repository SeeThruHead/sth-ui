import * as stylex from "@stylexjs/stylex"
import { Predicate } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import type { Child } from "../../content.ts"
import { radiusValue, sizeValue } from "../../styles/styleProps.ts"
import type { StyleValue } from "../../styles/styleProps.ts"
import { mapDefined, setDefinedVars, setVars, stylesApi, withDefaults } from "../../styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "../../styles/StylesApi.ts"
import { accentStyle } from "../../theme/accent.ts"
import { customAccent } from "../../theme/customAccent.ts"
import { accent, colors, fontSize, space } from "../../theme/tokens.stylex.ts"
import { rem } from "../../theme/units.ts"
import { indicatorVars } from "./Indicator.stylex.ts"

export type IndicatorPart = "root" | "indicator"

type Row = "top" | "middle" | "bottom"

type Column = "start" | "center" | "end"

export type IndicatorPosition = `${Row}-${Column}`

const positions: Readonly<Record<IndicatorPosition, readonly [Row, Column]>> = {
  "top-start": ["top", "start"],
  "top-center": ["top", "center"],
  "top-end": ["top", "end"],
  "middle-start": ["middle", "start"],
  "middle-center": ["middle", "center"],
  "middle-end": ["middle", "end"],
  "bottom-start": ["bottom", "start"],
  "bottom-center": ["bottom", "center"],
  "bottom-end": ["bottom", "end"]
}

export type IndicatorOptions = {
  readonly position?: IndicatorPosition
  readonly offset?: number | { readonly x: number; readonly y: number }
  readonly inline?: boolean
  readonly size?: StyleValue
  readonly radius?: StyleValue
  readonly color?: string
  readonly withBorder?: boolean
  readonly processing?: boolean
  readonly zIndex?: string | number
  readonly autoContrast?: boolean
  readonly showZero?: boolean
}

export type IndicatorProps = IndicatorOptions &
  StylesApiProps<IndicatorPart> & {
    readonly label?: Child | number
    readonly maxValue?: number
    readonly disabled?: boolean
    readonly children?: ReadonlyArray<Child>
  }

export type IndicatorConfig = ComponentConfig<IndicatorOptions, IndicatorPart>

const processing = stylex.keyframes({
  "0%": { opacity: 0.6, transform: "scale(0)" },
  "100%": { opacity: 0, transform: "scale(2.8)" }
})

const styles = stylex.create({
  root: { position: "relative", display: "block" },
  inline: { display: "inline-block" },
  indicator: {
    position: "absolute",
    top: indicatorVars.top,
    left: indicatorVars.left,
    right: indicatorVars.right,
    bottom: indicatorVars.bottom,
    transform: `translate(${indicatorVars.translateX}, ${indicatorVars.translateY})`,
    boxSizing: "border-box",
    minWidth: indicatorVars.size,
    height: indicatorVars.size,
    borderRadius: indicatorVars.radius,
    zIndex: indicatorVars.zIndex,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: fontSize.xs,
    backgroundColor: accent.filled,
    color: indicatorVars.textColor,
    whiteSpace: "nowrap",
    "::before": {
      content: "''",
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: accent.filled,
      borderRadius: indicatorVars.radius,
      zIndex: -1
    }
  },
  withLabel: { paddingInline: `calc(${space.xs} / 2)` },
  withBorder: { borderWidth: "2px", borderStyle: "solid", borderColor: colors.body },
  processing: {
    "::before": {
      animationName: processing,
      animationDuration: "1000ms",
      animationTimingFunction: "linear",
      animationIterationCount: "infinite"
    }
  },
  contrast: { [indicatorVars.textColor]: accent.contrast }
})

type Place = readonly [property: string, value: string]

const placeOf = (position: IndicatorPosition, offset: number | { readonly x: number; readonly y: number }) => {
  const x = rem(Predicate.isNumber(offset) ? offset : offset.x)
  const y = rem(Predicate.isNumber(offset) ? offset : offset.y)
  const [row, column] = positions[position]
  const vertical: Readonly<Record<Row, ReadonlyArray<Place>>> = {
    top: [
      [indicatorVars.top, y],
      [indicatorVars.translateY, "-50%"]
    ],
    middle: [
      [indicatorVars.top, "50%"],
      [indicatorVars.translateY, "-50%"]
    ],
    bottom: [
      [indicatorVars.bottom, y],
      [indicatorVars.translateY, "50%"]
    ]
  }
  const horizontal: Readonly<Record<Column, ReadonlyArray<Place>>> = {
    start: [
      [indicatorVars.left, x],
      [indicatorVars.translateX, "-50%"]
    ],
    center: [
      [indicatorVars.left, "50%"],
      [indicatorVars.translateX, "-50%"]
    ],
    end: [
      [indicatorVars.right, x],
      [indicatorVars.translateX, "50%"]
    ]
  }

  return [...vertical[row], ...horizontal[column]]
}

const labelOf = (label: IndicatorProps["label"], maxValue: number | undefined): Child | undefined => {
  if (!Predicate.isNumber(label)) return label
  if (maxValue !== undefined && label > maxValue) return `${maxValue}+`

  return String(label)
}

const hidesZero = (props: IndicatorProps) => props.showZero === false && (props.label === 0 || props.label === "0")

const hasLabel = (label: IndicatorProps["label"]) => label !== undefined && label !== "" && label !== 0

export const Indicator =
  (config: { readonly Indicator?: IndicatorConfig }) =>
  <M>(h: HtmlBuilder<M>, input: IndicatorProps): Html => {
    const props = withDefaults(config.Indicator, input)
    const getStyles = stylesApi<M, IndicatorPart>(h, props, config.Indicator, "root")
    const label = labelOf(props.label, props.maxValue)
    const shown = props.disabled !== true && !hidesZero(props)

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          props.inline === true && styles.inline,
          ...accentStyle(props.color, customAccent),
          props.autoContrast === true && styles.contrast,
          setVars(...placeOf(props.position ?? "top-end", props.offset ?? 0)),
          setDefinedVars(
            [indicatorVars.size, mapDefined(props.size, sizeValue)],
            [indicatorVars.radius, mapDefined(props.radius, radiusValue)],
            [indicatorVars.zIndex, mapDefined(props.zIndex, String)]
          )
        ),
        ...(props.inline === true ? [h.DataAttribute("inline", "")] : [])
      ],
      [
        ...(shown
          ? [
              h.div(
                [
                  ...getStyles(
                    "indicator",
                    styles.indicator,
                    hasLabel(props.label) && styles.withLabel,
                    props.withBorder === true && styles.withBorder,
                    props.processing === true && styles.processing
                  ),
                  ...(hasLabel(props.label) ? [h.DataAttribute("with-label", "")] : []),
                  ...(props.withBorder === true ? [h.DataAttribute("with-border", "")] : []),
                  ...(props.processing === true ? [h.DataAttribute("processing", "")] : [])
                ],
                label === undefined ? [] : [label]
              )
            ]
          : []),
        ...(props.children ?? [])
      ]
    )
  }
