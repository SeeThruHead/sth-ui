import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { spacing } from "@sth-ui/core/styles/styleProps.ts"
import type { StyleValue } from "@sth-ui/core/styles/styleProps.ts"
import { setDefinedStyle, setVars, stylesApi, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { accentStyle, themeColor } from "@sth-ui/core/theme/accent.ts"
import { customAccent } from "@sth-ui/core/theme/customAccent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { accent, colors, fontSize, fontWeight, radius, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { barsVars } from "./bars.stylex.ts"

export type BarsListBarData = {
  readonly name: string
  readonly value: number
  readonly color?: string
  readonly textColor?: string
  readonly variant?: "light" | "filled"
}

export type BarsListPart = "root" | "bar" | "barLabel" | "barValue" | "labelsRow"

export type BarsListOptions = {
  readonly barGap?: StyleValue
  readonly minBarSize?: number | string
  readonly barHeight?: number | string
  readonly barColor?: string
  readonly barTextColor?: string
  readonly autoContrast?: boolean
  readonly variant?: "light" | "filled"
}

export type BarsListProps = BarsListOptions &
  StylesApiProps<BarsListPart> & {
    readonly data: ReadonlyArray<BarsListBarData>
    readonly valueFormatter?: (value: number) => string
    readonly barsLabel?: string
    readonly valueLabel?: string
    readonly renderBar?: (data: BarsListBarData, defaultBar: Html) => Html
  }

export type BarsListConfig = ComponentConfig<BarsListOptions, BarsListPart>

const styles = stylex.create({
  root: { display: "flex", flexDirection: "column", gap: barsVars.gap, width: "100%" },
  labelsRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    paddingBottom: barsVars.gap
  },
  bar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: space.md },
  barLabel: {
    display: "flex",
    alignItems: "center",
    boxSizing: "border-box",
    minWidth: barsVars.minSize,
    height: barsVars.height,
    paddingBlock: 0,
    paddingInline: space.sm,
    fontSize: fontSize.sm,
    fontWeight: 500,
    whiteSpace: "nowrap",
    borderRadius: radius.sm,
    transitionProperty: "width",
    transitionDuration: "300ms",
    transitionTimingFunction: "ease"
  },
  light: { backgroundColor: accent.light, color: accent.lightColor },
  filled: { backgroundColor: accent.filled, color: palette.white },
  contrast: { color: accent.contrast },
  empty: { paddingInline: 0 },
  barValue: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, whiteSpace: "nowrap", color: colors.text }
})

const length = (value: number | string) => (typeof value === "number" ? `${value}px` : value)

export const BarsList =
  (config: { readonly BarsList?: BarsListConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BarsListProps): Html => {
    const props = withDefaults(config.BarsList, input)
    const getStyles = stylesApi<M, BarsListPart>(h, props, config.BarsList, "root")
    const top = Math.max(...props.data.map((item) => item.value), 0)
    const format = props.valueFormatter ?? String
    const bar = (item: BarsListBarData): Html => {
      const percent = top > 0 ? (item.value / top) * 100 : 0
      const variant = item.variant ?? props.variant ?? "light"
      const text = item.textColor ?? props.barTextColor

      return h.div(getStyles("bar", styles.bar), [
        h.div(
          [
            ...getStyles(
              "barLabel",
              styles.barLabel,
              ...accentStyle(item.color ?? props.barColor, customAccent),
              variant === "filled" ? styles.filled : styles.light,
              variant === "filled" && props.autoContrast === true && styles.contrast,
              percent === 0 && styles.empty,
              setDefinedStyle(["width", `${percent}%`], ["color", text === undefined ? undefined : themeColor(text)])
            )
          ],
          [item.name]
        ),
        h.div(getStyles("barValue", styles.barValue), [format(item.value)])
      ])
    }
    const labels =
      props.barsLabel === undefined && props.valueLabel === undefined
        ? []
        : [
            h.div(getStyles("labelsRow", styles.labelsRow), [
              h.div([], [props.barsLabel ?? ""]),
              h.div([], [props.valueLabel ?? ""])
            ])
          ]
    const render = props.renderBar

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          setVars(
            [barsVars.gap, spacing(props.barGap ?? 5)],
            [barsVars.minSize, length(props.minBarSize ?? 0)],
            [barsVars.height, length(props.barHeight ?? 32)]
          )
        )
      ],
      [
        ...labels,
        ...props.data.map((item) => (render === undefined ? bar(item) : h.div([], [render(item, bar(item))])))
      ]
    )
  }
