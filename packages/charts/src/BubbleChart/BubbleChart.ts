import * as stylex from "@stylexjs/stylex"
import { Array as Arr } from "effect"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars, stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { palette } from "@sth-ui/core/theme/palette.stylex.ts"
import { colors, fontSize, radius, shadow, space } from "@sth-ui/core/theme/tokens.stylex.ts"
import { focusable, keyboardOn } from "../shared/keyboard.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { chartHover } from "../shared/chartParts.ts"
import { niceTicks } from "../shared/geometry.ts"
import { bandCenter, numberAt, yFraction } from "../grid/grid.ts"
import type { ChartRow } from "../grid/grid.ts"
import { gridVars } from "../grid/grid.stylex.ts"
import { bubbleDiameter, domainOf } from "./bubble.ts"

export type BubbleChartDataKey = { readonly x: string; readonly y: string; readonly z: string }

export type BubbleChartPart = "root" | "axis" | "tooltip"

export type BubbleChartOptions = {
  readonly color?: string
  readonly withTooltip?: boolean
  readonly accessibilityLayer?: boolean
  readonly textColor?: string
  readonly gridColor?: string
}

export type BubbleChartProps = BubbleChartOptions &
  StylesApiProps<BubbleChartPart> & {
    readonly data: ReadonlyArray<ChartRow>
    readonly dataKey: BubbleChartDataKey
    readonly range: readonly [number, number]
    readonly label?: string
    readonly valueFormatter?: (value: number) => string
  }

export type BubbleChartConfig = ComponentConfig<BubbleChartOptions, BubbleChartPart>

const styles = stylex.create({
  root: {
    position: "relative",
    display: "grid",
    gridTemplateRows: "1fr 30px",
    gridTemplateColumns: "0px 1fr",
    width: "100%",
    boxSizing: "border-box",
    paddingBlock: "5px",
    paddingInline: "5px",
    fontSize: "12px",
    color: gridVars.text,
    [gridVars.text]: colors.dimmed,
    [gridVars.grid]: "light-dark(rgba(173, 181, 189, 0.6), rgba(105, 105, 105, 0.6))"
  },
  withLabel: { gridTemplateColumns: "60px 1fr" },
  cell: { position: "relative", minWidth: 0, minHeight: 0 },
  label: { position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)", whiteSpace: "nowrap" },
  axis: { borderTopWidth: "1px", borderTopStyle: "solid", borderTopColor: "currentColor" },
  tick: { position: "absolute", top: "12px", transform: "translateX(-50%)", whiteSpace: "nowrap", lineHeight: 1 },
  tickLine: {
    position: "absolute",
    top: "-6px",
    height: "6px",
    width: 0,
    borderLeftWidth: "1px",
    borderLeftStyle: "solid"
  },
  bubble: { position: "absolute", borderRadius: "50%", transform: "translate(-50%, -50%)" },
  tooltip: {
    position: "absolute",
    zIndex: 1000,
    display: "none",
    pointerEvents: "none",
    minWidth: "200px",
    paddingBlock: space.sm,
    paddingInline: space.sm,
    fontSize: fontSize.sm,
    color: colors.text,
    backgroundColor: colors.body,
    boxShadow: shadow.md,
    borderRadius: radius.default,
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: `light-dark(${palette.gray3}, ${palette.dark4})`
  },
  tooltipRow: { display: "flex", justifyContent: "space-between", gap: space.md }
})

const colorVars = (props: BubbleChartProps) =>
  setVars(
    ...(props.textColor === undefined ? [] : [[gridVars.text, themeColor(props.textColor)] as const]),
    ...(props.gridColor === undefined ? [] : [[gridVars.grid, themeColor(props.gridColor)] as const])
  )

export const BubbleChart =
  (config: { readonly BubbleChart?: BubbleChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: BubbleChartProps): Html => {
    const props = withDefaults(config.BubbleChart, input)
    const getStyles = stylesApi<M, BubbleChartPart>(h, props, config.BubbleChart, "root")
    const count = props.data.length
    const zs = props.data.map((row) => numberAt(row, props.dataKey.z) ?? 0)
    const domain = domainOf(zs)
    const rows = Arr.zip(props.data, zs)
    const yTicks = niceTicks(props.data.map((row) => numberAt(row, props.dataKey.y) ?? 0))
    const format = props.valueFormatter ?? String
    const color = themeColor(props.color ?? "blue.6")

    return h.div(
      [
        ...getStyles(
          "root",
          styles.root,
          props.label !== undefined && styles.withLabel,
          colorVars(props),
          keyboardOn(props) && shared.focusRing
        ),
        ...focusable(h, keyboardOn(props)),
        chartHover(h)
      ],
      [
        h.div(
          [...sx(h, styles.cell), h.Style({ gridColumn: "1", gridRow: "1" })],
          props.label === undefined ? [] : [h.span(sx(h, styles.label), [props.label])]
        ),
        h.div(
          [...sx(h, styles.cell), h.Style({ gridColumn: "2", gridRow: "1" })],
          rows.map(([row, z], index) => {
            const size = `${bubbleDiameter(z, domain, props.range)}px`

            return h.span(
              [
                ...sx(h, styles.bubble),
                h.Style({
                  left: `${bandCenter(index, count) * 100}%`,
                  top: `${yFraction(numberAt(row, props.dataKey.y) ?? 0, yTicks) * 100}%`,
                  width: size,
                  height: size,
                  backgroundColor: color
                }),
                h.DataAttribute("segment", String(index))
              ],
              []
            )
          })
        ),
        h.div(
          [...getStyles("axis", styles.cell, styles.axis), h.Style({ gridColumn: "2", gridRow: "2" })],
          props.data.flatMap((row, index) => {
            const left = `${bandCenter(index, count) * 100}%`

            return [
              h.span([...sx(h, styles.tickLine), h.Style({ left })], []),
              h.span([...sx(h, styles.tick), h.Style({ left })], [String(row[props.dataKey.x])])
            ]
          })
        ),
        ...(props.withTooltip === false
          ? []
          : rows.map(([row, z], index) =>
              h.div(
                [...getStyles("tooltip", styles.tooltip), h.DataAttribute("chart-tooltip", String(index))],
                [h.div(sx(h, styles.tooltipRow), [h.span([], [String(row[props.dataKey.x])]), h.span([], [format(z)])])]
              )
            ))
      ]
    )
  }
