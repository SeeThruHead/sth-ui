import * as stylex from "@stylexjs/stylex"
import type { Html, HtmlBuilder } from "foldkit/html"
import { stylesApi, sx, withDefaults } from "@sth-ui/core/styles/StylesApi.ts"
import type { ComponentConfig, StylesApiProps } from "@sth-ui/core/styles/StylesApi.ts"
import { themeColor } from "@sth-ui/core/theme/accent.ts"
import { niceTicks } from "../shared/geometry.ts"
import { focusable, keyboardOn } from "../shared/keyboard.ts"
import { shared } from "@sth-ui/core/styles/shared.ts"
import { chartHover, chartTooltip } from "../shared/chartParts.ts"
import { numberAt, yFraction } from "../grid/grid.ts"
import type { ChartRow } from "../grid/grid.ts"
import { gridView } from "../grid/gridView.ts"
import type { GridOptions, GridPart, ReferenceLine } from "../grid/gridView.ts"

export type ScatterChartSeries = {
  readonly name: string
  readonly color: string
  readonly data: ReadonlyArray<ChartRow>
}

export type ScatterChartPart = GridPart | "scatter"

export type ScatterAxes<A> = { readonly x?: A; readonly y?: A }

export type ScatterChartOptions = Omit<GridOptions, "unit">

export type ScatterChartProps = ScatterChartOptions &
  StylesApiProps<ScatterChartPart> & {
    readonly data: ReadonlyArray<ScatterChartSeries>
    readonly dataKey: { readonly x: string; readonly y: string }
    readonly unit?: ScatterAxes<string>
    readonly labels?: ScatterAxes<string>
    readonly valueFormatter?: ((value: number) => string) | ScatterAxes<(value: number) => string>
    readonly xAxisLabel?: string
    readonly yAxisLabel?: string
    readonly referenceLines?: ReadonlyArray<ReferenceLine>
  }

export type ScatterChartConfig = ComponentConfig<ScatterChartOptions, ScatterChartPart>

const styles = stylex.create({
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  point: {
    position: "absolute",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    transform: "translate(-50%, -50%)",
    opacity: { default: 1, ":is([data-dimmed])": 0.1 }
  }
})

const formatterOf = (formatter: ScatterChartProps["valueFormatter"], axis: "x" | "y"): ((value: number) => string) => {
  if (formatter === undefined) return String
  if (typeof formatter === "function") return formatter

  return formatter[axis] ?? String
}

export const ScatterChart =
  (config: { readonly ScatterChart?: ScatterChartConfig }) =>
  <M>(h: HtmlBuilder<M>, input: ScatterChartProps): Html => {
    const props = withDefaults(config.ScatterChart, input)
    const getStyles = stylesApi<M, ScatterChartPart>(h, props, config.ScatterChart, "root")
    const points = props.data.flatMap((series, seriesIndex) =>
      series.data.flatMap((row) => {
        const x = numberAt(row, props.dataKey.x)
        const y = numberAt(row, props.dataKey.y)
        if (x === null || y === null) return []

        return [{ series, seriesIndex, row, x, y }]
      })
    )
    const xTicks = niceTicks(points.map((point) => point.x))
    const unit = { x: props.unit?.x ?? "", y: props.unit?.y ?? "" }
    const format = { x: formatterOf(props.valueFormatter, "x"), y: formatterOf(props.valueFormatter, "y") }
    const { unit: _unit, valueFormatter: _formatter, ...rest } = props

    return gridView(
      h,
      getStyles,
      {
        ...rest,
        data: [],
        dataKey: props.dataKey.x,
        series: props.data.map((series) => ({ name: series.name, color: series.color })),
        withTooltip: false
      },
      {
        values: points.map((point) => point.y),
        tickFormat: (value) => `${format.y(value)}${unit.y}`,
        svg: () => [],
        xTicks: { values: xTicks, format: (value) => `${format.x(value)}${unit.x}` },
        overlay: (ticks) => [
          h.div(
            [
              ...sx(h, styles.layer, keyboardOn(props) && shared.focusRing),
              ...focusable(h, keyboardOn(props)),
              chartHover(h)
            ],
            [
              ...points.map((point, index) =>
                h.span(
                  [
                    ...getStyles("scatter", styles.point),
                    h.Style({
                      left: `${(1 - yFraction(point.x, xTicks)) * 100}%`,
                      top: `${yFraction(point.y, ticks) * 100}%`,
                      backgroundColor: themeColor(point.series.color)
                    }),
                    h.DataAttribute("segment", String(index)),
                    h.DataAttribute("series", String(point.seriesIndex))
                  ],
                  []
                )
              ),
              ...(props.withTooltip === false
                ? []
                : points.map((point, index) =>
                    chartTooltip(h, getStyles, {
                      ...(typeof point.row["name"] === "string" ? { label: point.row["name"] } : {}),
                      key: String(index),
                      showColor: false,
                      format: String,
                      items: [
                        {
                          name: props.labels?.x ?? props.dataKey.x,
                          value: point.x,
                          color: "",
                          text: `${format.x(point.x)}${unit.x}`
                        },
                        {
                          name: props.labels?.y ?? props.dataKey.y,
                          value: point.y,
                          color: "",
                          text: `${format.y(point.y)}${unit.y}`
                        }
                      ]
                    })
                  ))
            ]
          )
        ]
      }
    )
  }
