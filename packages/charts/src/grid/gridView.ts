import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { setVars, sx } from "@sth-ui/core/styles/StylesApi.ts"
import type { GetStyles } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { colors } from "@sth-ui/core/theme/tokens.stylex.ts"
import { chartLegend, chartTooltip, legendHover } from "../shared/chartParts.ts"
import type { ChartItem, ChartLegendPart, ChartTooltipPart } from "../shared/chartParts.ts"
import type { Point } from "../shared/geometry.ts"
import { niceTicks } from "../shared/geometry.ts"
import { bandCenter, numberAt, xFraction, yFraction } from "./grid.ts"
import type { ChartRow, ChartSeries } from "./grid.ts"
import { gridHover, tickThinning } from "./gridHover.ts"
import { focusable, keyboardOn } from "../shared/keyboard.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { gridVars } from "./grid.stylex.ts"

export type GridPart = "root" | "axis" | "axisLabel" | "grid" | "referenceLine" | ChartTooltipPart | ChartLegendPart

export type ReferenceLine = { readonly y: number; readonly label?: string; readonly color?: string }

export type GridOptions = {
  readonly withXAxis?: boolean
  readonly withYAxis?: boolean
  readonly withTooltip?: boolean
  readonly accessibilityLayer?: boolean
  readonly withLegend?: boolean
  readonly withDots?: boolean
  readonly tickLine?: "x" | "y" | "xy" | "none"
  readonly gridAxis?: "x" | "y" | "xy" | "none"
  readonly strokeDasharray?: string
  readonly textColor?: string
  readonly gridColor?: string
  readonly cursorFill?: string
  readonly unit?: string
}

export type GridInput = GridOptions & {
  readonly data: ReadonlyArray<ChartRow>
  readonly dataKey: string
  readonly series: ReadonlyArray<ChartSeries>
  readonly valueFormatter?: (value: number) => string
  readonly xAxisLabel?: string
  readonly yAxisLabel?: string
  readonly referenceLines?: ReadonlyArray<ReferenceLine>
}

export type GridDrawing = {
  readonly values: ReadonlyArray<number>
  readonly ticks?: ReadonlyArray<number>
  readonly tickFormat?: (value: number) => string
  readonly svg: (ticks: ReadonlyArray<number>) => ReadonlyArray<Html>
  readonly largeDots?: boolean
  readonly band?: boolean
  readonly xTicks?: { readonly values: ReadonlyArray<number>; readonly format: (value: number) => string }
  readonly overlay?: (ticks: ReadonlyArray<number>) => ReadonlyArray<Html>
  readonly tooltip?: { readonly items: (row: ChartRow) => ReadonlyArray<ChartItem>; readonly showColor: boolean }
  readonly dots?: (ticks: ReadonlyArray<number>) => ReadonlyArray<{
    readonly series: number
    readonly color: string
    readonly points: ReadonlyArray<Point & { readonly index: number }>
  }>
}

export const gridStyles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    boxSizing: "border-box",
    paddingBlock: "5px",
    paddingInline: "5px",
    fontSize: "12px",
    color: gridVars.text,
    [gridVars.text]: colors.dimmed,
    [gridVars.grid]: "light-dark(rgba(173, 181, 189, 0.6), rgba(105, 105, 105, 0.6))",
    [gridVars.cursor]: "light-dark(rgba(173, 181, 189, 0.15), rgba(105, 105, 105, 0.15))"
  },
  body: { flexGrow: 1, display: "grid", minHeight: 0 },
  cell: { position: "relative", minWidth: 0, minHeight: 0 },
  plot: { position: "relative", minWidth: 0, minHeight: 0, gridColumn: 2, gridRow: 1 },
  svg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible" },
  grid: { stroke: gridVars.grid },
  yTick: {
    position: "absolute",
    right: "16px",
    transform: "translateY(-50%)",
    whiteSpace: "nowrap",
    lineHeight: 1
  },
  xTick: { position: "absolute", top: "12px", transform: "translateX(-50%)", whiteSpace: "nowrap", lineHeight: 1 },
  yTickLine: {
    position: "absolute",
    right: 0,
    width: "6px",
    height: 0,
    borderTopWidth: "1px",
    borderTopStyle: "solid",
    borderTopColor: gridVars.grid
  },
  xTickLine: {
    position: "absolute",
    top: 0,
    width: 0,
    height: "6px",
    borderLeftWidth: "1px",
    borderLeftStyle: "solid",
    borderLeftColor: gridVars.grid
  },
  line: { fill: "none", strokeOpacity: { default: 1, ":is([data-dimmed])": 0.5 } },
  dot: {
    position: "absolute",
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    opacity: { default: 1, ":is([data-dimmed])": 0 },
    backgroundColor: "currentColor"
  },
  dotLarge: {
    width: { default: "8px", ":is([data-active])": "10px" },
    height: { default: "8px", ":is([data-active])": "10px" },
    boxSizing: "border-box",
    borderWidth: { default: 0, ":is([data-active])": "2px" },
    borderStyle: "solid",
    borderColor: "currentColor",
    backgroundColor: { default: "currentColor", ":is([data-active])": "white" }
  },
  dotActive: {
    width: { default: "7px", ":is([data-active])": "10px" },
    height: { default: "7px", ":is([data-active])": "10px" }
  },
  cursor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    display: "none",
    width: 0,
    borderLeftWidth: "1px",
    borderLeftStyle: "dashed",
    borderLeftColor: gridVars.grid,
    pointerEvents: "none"
  },
  cursorBand: {
    boxSizing: "border-box",
    borderWidth: "1px",
    borderStyle: "dashed",
    borderColor: gridVars.grid,
    backgroundColor: gridVars.cursor
  },
  axisLabel: { position: "absolute", whiteSpace: "nowrap", lineHeight: 1 },
  xAxisLabel: { left: "50%", bottom: 0, transform: "translateX(-50%)" },
  yAxisLabel: { left: 0, top: "50%", transform: "rotate(-90deg) translateX(50%)", transformOrigin: "left top" },
  reference: { position: "absolute", left: 0, right: 0, height: 0, borderTopWidth: "1px", borderTopStyle: "solid" },
  referenceLabel: { position: "absolute", left: "5px", bottom: "4px", whiteSpace: "nowrap", lineHeight: 1 }
})

const shows = (axis: string, which: "x" | "y") => axis === which || axis === "xy"

export const colorOf = (series: ChartSeries) => themeColor(series.color)

const colorVars = (input: GridInput) =>
  setVars(
    ...(input.textColor === undefined ? [] : [[gridVars.text, themeColor(input.textColor)] as const]),
    ...(input.gridColor === undefined ? [] : [[gridVars.grid, themeColor(input.gridColor)] as const]),
    ...(input.cursorFill === undefined ? [] : [[gridVars.cursor, themeColor(input.cursorFill)] as const])
  )

export const gridView = <M>(
  h: HtmlBuilder<M>,
  getStyles: GetStyles<M, GridPart>,
  input: GridInput,
  drawing: GridDrawing
): Html => {
  const styles = gridStyles
  const props = input
  const withXAxis = props.withXAxis !== false
  const withYAxis = props.withYAxis !== false
  const tickLine = props.tickLine ?? "y"
  const gridAxis = props.gridAxis ?? "x"
  const dash = props.strokeDasharray ?? "5 5"
  const ticks = drawing.ticks ?? niceTicks(drawing.values)
  const count = props.data.length
  const band = drawing.band === true
  const xOf = (index: number) => (band ? bandCenter(index, count) : xFraction(index, count))
  const format = props.valueFormatter ?? String
  const unit = props.unit ?? ""
  const yTicks = withYAxis
    ? ticks.flatMap((tick) => {
        const top = `${yFraction(tick, ticks) * 100}%`

        return [
          h.span(
            [...getStyles("axis", styles.yTick), h.Style({ top }), h.DataAttribute("y-tick", "")],
            [`${(drawing.tickFormat ?? format)(tick)}${unit}`]
          ),
          ...(shows(tickLine, "y") ? [h.span([...sx(h, styles.yTickLine), h.Style({ top })], [])] : [])
        ]
      })
    : []
  const numeric = drawing.xTicks
  const columns =
    numeric === undefined
      ? props.data.map((row, index) => ({ fraction: xOf(index), label: String(row[props.dataKey]) }))
      : numeric.values.map((value) => ({
          fraction: 1 - yFraction(value, numeric.values),
          label: numeric.format(value)
        }))
  const xTicks = withXAxis
    ? columns.flatMap((column) => {
        const left = `${column.fraction * 100}%`

        return [
          h.span(
            [...getStyles("axis", styles.xTick), h.Style({ left }), h.DataAttribute("x-tick", "")],
            [column.label]
          ),
          ...(shows(tickLine, "x") ? [h.span([...sx(h, styles.xTickLine), h.Style({ left })], [])] : [])
        ]
      })
    : []
  const gridLines = [
    ...(shows(gridAxis, "x")
      ? ticks.map((tick) => {
          const y = String(yFraction(tick, ticks) * 100)

          return h.line(
            [
              ...getStyles("grid", styles.grid),
              h.Attribute("x1", "0"),
              h.Attribute("x2", "100"),
              h.Attribute("y1", y),
              h.Attribute("y2", y),
              h.Attribute("stroke-dasharray", dash),
              h.Attribute("vector-effect", "non-scaling-stroke")
            ],
            []
          )
        })
      : []),
    ...(shows(gridAxis, "y")
      ? columns.map((column) => {
          const x = String(column.fraction * 100)

          return h.line(
            [
              ...getStyles("grid", styles.grid),
              h.Attribute("x1", x),
              h.Attribute("x2", x),
              h.Attribute("y1", "0"),
              h.Attribute("y2", "100"),
              h.Attribute("stroke-dasharray", dash),
              h.Attribute("vector-effect", "non-scaling-stroke")
            ],
            []
          )
        })
      : [])
  ]
  const dots =
    props.withDots === false
      ? []
      : (drawing.dots?.(ticks) ?? []).flatMap(({ series, color, points }) =>
          points.map((point) =>
            h.span(
              [
                ...sx(h, styles.dot, drawing.largeDots === true ? styles.dotLarge : styles.dotActive),
                h.Style({ left: `${point.x}%`, top: `${point.y}%`, color }),
                h.DataAttribute("series", String(series)),
                h.DataAttribute("dot-index", String(point.index))
              ],
              []
            )
          )
        )
  const references = (props.referenceLines ?? []).map((reference) => {
    const color = reference.color === undefined ? gridVars.grid : themeColor(reference.color)

    return h.div(
      [
        ...getStyles("referenceLine", styles.reference),
        h.Style({
          top: `${yFraction(reference.y, ticks) * 100}%`,
          borderTopColor: String(color),
          color: String(color)
        })
      ],
      reference.label === undefined ? [] : [h.span(sx(h, styles.referenceLabel), [reference.label])]
    )
  })
  const seriesItems = (row: ChartRow): ReadonlyArray<ChartItem> =>
    props.series.flatMap((series) => {
      const value = numberAt(row, series.name)

      return value === null ? [] : [{ name: series.label ?? series.name, value, color: colorOf(series) }]
    })
  const custom = drawing.tooltip
  const tooltipOf = (row: ChartRow, index: number): ReadonlyArray<Html> => {
    const items = custom === undefined ? seriesItems(row) : custom.items(row)
    if (custom !== undefined && items.length === 0) return []

    return [
      chartTooltip(h, getStyles, {
        label: String(row[props.dataKey]),
        key: String(index),
        format: (value) => `${format(value)}${unit}`,
        items,
        ...(custom === undefined ? {} : { showColor: custom.showColor })
      })
    ]
  }
  const tooltips = props.withTooltip === false ? [] : props.data.flatMap(tooltipOf)
  const xRow = withXAxis ? 30 + (props.xAxisLabel === undefined ? 0 : 30) : 0

  return h.div(
    [...getStyles("root", styles.root, colorVars(props)), h.Dir("ltr"), legendHover(h)],
    [
      ...(props.withLegend === true
        ? [
            chartLegend(
              h,
              getStyles,
              props.series.map((series) => ({ name: series.label ?? series.name, value: 0, color: colorOf(series) })),
              "top"
            )
          ]
        : []),
      h.div(
        [
          ...sx(h, styles.body),
          h.Style({ gridTemplateColumns: `${withYAxis ? 60 : 0}px 1fr`, gridTemplateRows: `1fr ${xRow}px` })
        ],
        [
          h.div(
            [...sx(h, styles.cell), h.Style({ gridColumn: "1", gridRow: "1" })],
            [
              ...yTicks,
              ...(props.yAxisLabel === undefined
                ? []
                : [h.span(getStyles("axisLabel", styles.axisLabel, styles.yAxisLabel), [props.yAxisLabel])])
            ]
          ),
          h.div(
            [
              ...sx(h, styles.plot, keyboardOn(props) && shared.focusRing),
              ...focusable(h, keyboardOn(props)),
              h.DataAttribute("plot", ""),
              h.DataAttribute("count", String(count)),
              ...(band ? [h.DataAttribute("band", "")] : []),
              gridHover(h)
            ],
            [
              h.svg(
                [
                  ...sx(h, styles.svg),
                  h.Attribute("viewBox", "0 0 100 100"),
                  h.Attribute("preserveAspectRatio", "none"),
                  h.AriaHidden(true)
                ],
                [...gridLines, ...drawing.svg(ticks)]
              ),
              ...references,
              h.div(
                [
                  ...sx(h, styles.cursor, band && styles.cursorBand),
                  ...(band ? [h.Style({ width: `${100 / Math.max(count, 1)}%` })] : []),
                  h.DataAttribute("cursor", "")
                ],
                []
              ),
              ...(drawing.overlay === undefined ? [] : drawing.overlay(ticks)),
              ...dots,
              ...tooltips
            ]
          ),
          h.div(
            [...sx(h, styles.cell), h.Style({ gridColumn: "2", gridRow: "2" }), tickThinning(h)],
            [
              ...xTicks,
              ...(props.xAxisLabel === undefined
                ? []
                : [h.span(getStyles("axisLabel", styles.axisLabel, styles.xAxisLabel), [props.xAxisLabel])])
            ]
          )
        ]
      )
    ]
  )
}
